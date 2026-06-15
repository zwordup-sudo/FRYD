from fastapi import APIRouter, Depends, HTTPException, Response, status, Form, BackgroundTasks, Header, Request
from sqlalchemy.orm import Session
import os
import httpx

from app.db.session import get_db, SessionLocal
from app.users.security import get_current_user
from app.users.models import User
from .models import Conversation

from .schemas import (
    AssistantInteractionCreate,
    AssistantInteractionRead,
    ChatMessageRequest,
    ChatMessageResponse,
    ConversationListItem,
    ConversationResponse,
    ProviderInfo,
    TestConnectionRequest,
    TestConnectionResponse,
    GraphResponseSchema,
    InsightItem,
)
from .services import AssistantService

router = APIRouter()



from fastapi.responses import StreamingResponse

# --- Chat ---

@router.post("/chat", response_model=ChatMessageResponse, status_code=status.HTTP_200_OK)
async def chat(
    request: ChatMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Send a message to the AI assistant and get a response."""
    service = AssistantService(db, user_id=current_user.id)
    return await service.chat(request)


@router.post("/chat/stream")
async def chat_stream(
    request: ChatMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Send a message to the AI assistant and stream the response."""
    service = AssistantService(db, user_id=current_user.id)
    generator = await service.chat_stream(request)
    return StreamingResponse(generator, media_type="text/event-stream")


# --- Conversations ---

@router.get("/conversations", response_model=list[ConversationListItem], status_code=status.HTTP_200_OK)
def list_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all conversations."""
    service = AssistantService(db, user_id=current_user.id)
    return service.get_conversations()


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse, status_code=status.HTTP_200_OK)
def get_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a conversation with all its messages."""
    service = AssistantService(db, user_id=current_user.id)
    return service.get_conversation(conversation_id)


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a conversation."""
    service = AssistantService(db, user_id=current_user.id)
    service.delete_conversation(conversation_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# --- Providers ---

@router.get("/providers", response_model=list[ProviderInfo], status_code=status.HTTP_200_OK)
def list_providers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all available AI providers."""
    service = AssistantService(db, user_id=current_user.id)
    return service.get_providers()


@router.post("/test-connection", response_model=TestConnectionResponse, status_code=status.HTTP_200_OK)
async def test_connection(
    request: TestConnectionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Test connection to an AI provider."""
    service = AssistantService(db, user_id=current_user.id)
    return await service.test_provider_connection(request)


# --- Graph ---

@router.get("/graph", response_model=GraphResponseSchema, status_code=status.HTTP_200_OK)
def get_graph(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the interactive knowledge graph data."""
    service = AssistantService(db, user_id=current_user.id)
    return service.get_graph_data()


# --- Insights ---

@router.get("/insights", response_model=list[InsightItem], status_code=status.HTTP_200_OK)
def get_insights(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get smart daily insights based on user data patterns."""
    service = AssistantService(db, user_id=current_user.id)
    return service.get_insights()


# --- Legacy endpoints (backward compatibility) ---


@router.post("/", response_model=AssistantInteractionRead)
def create_new_interaction(
    interaction_create: AssistantInteractionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = AssistantService(db, user_id=current_user.id)
    interaction = service.create_interaction(interaction_create)
    return interaction


@router.get("/{interaction_id}", response_model=AssistantInteractionRead)
def read_interaction(
    interaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = AssistantService(db, user_id=current_user.id)
    interaction = service.get_interaction_by_id(interaction_id)
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")
    return interaction


def clean_phone_to_digits(phone: str) -> str:
    if not phone:
        return ""
    return "".join(c for c in phone if c.isdigit())

def phone_numbers_match(phone_a: str, phone_b: str) -> bool:
    digits_a = clean_phone_to_digits(phone_a)
    digits_b = clean_phone_to_digits(phone_b)
    if not digits_a or not digits_b:
        return False
    if digits_a == digits_b:
        return True
    # Handle Mexico prefix 52 1 vs 52
    if digits_a.startswith("521") and len(digits_a) == 13:
        if digits_a[:2] + digits_a[3:] == digits_b:
            return True
    if digits_b.startswith("521") and len(digits_b) == 13:
        if digits_b[:2] + digits_b[3:] == digits_a:
            return True
    return False

def load_env_file():
    """Manually load the .env file if it exists to avoid dependency on python-dotenv."""
    env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    parts = line.split("=", 1)
                    os.environ[parts[0].strip()] = parts[1].strip()

# Load env variables on module import
load_env_file()

async def process_whatsapp_message(sender_phone: str, message_body: str, user_id: int):
    """Process incoming WhatsApp message in the background and reply using Twilio API."""
    db = SessionLocal()
    try:
        # Refetch user to get DB session binding
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return

        provider = user.ai_provider or "ollama"
        model = user.ai_model
        api_key = user.ai_api_key

        # Find or create a conversation for WhatsApp
        conversation = db.query(Conversation).filter(
            Conversation.user_id == user.id,
            Conversation.title == "WhatsApp Chat"
        ).first()

        if not conversation:
            conversation = Conversation(
                provider=provider,
                model=model,
                title="WhatsApp Chat",
                user_id=user.id
            )
            db.add(conversation)
            db.commit()
            db.refresh(conversation)

        # Process chat request
        chat_request = ChatMessageRequest(
            message=message_body,
            conversation_id=conversation.id,
            provider=provider,
            model=model,
            api_key=api_key
        )

        service = AssistantService(db, user_id=user.id)
        try:
            chat_response = await service.chat(chat_request)
            reply_text = chat_response.content
        except Exception as e:
            reply_text = f"Error al generar respuesta de IA: {str(e)}"

        # Send response back via Twilio WhatsApp HTTP API
        account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        from_number = os.getenv("TWILIO_NUMBER", "whatsapp:+14155238886")

        if account_sid and auth_token and not account_sid.startswith("tu_"):
            url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"
            auth = (account_sid, auth_token)
            data = {
                "From": from_number,
                "To": sender_phone,
                "Body": reply_text
            }
            async with httpx.AsyncClient() as client:
                response = await client.post(url, auth=auth, data=data)
                if response.status_code != 201:
                    print(f"Failed to send Twilio message async: {response.text}")
        else:
            print("Twilio credentials not configured in backend/.env. Cannot send async WhatsApp reply.")
    except Exception as e:
        print(f"Error in background WhatsApp processor: {str(e)}")
    finally:
        db.close()

@router.post("/whatsapp")
async def whatsapp_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    From: str = Form(...),
    Body: str = Form(...),
    db: Session = Depends(get_db),
    x_twilio_signature: str | None = Header(None)
):
    """Webhook for Twilio WhatsApp sandbox integration."""
    env = os.getenv("ENV", "development")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    
    if (env == "production" or x_twilio_signature) and auth_token:
        if not x_twilio_signature:
            raise HTTPException(status_code=400, detail="Missing X-Twilio-Signature header")
            
        from twilio.request_validator import RequestValidator
        validator = RequestValidator(auth_token)
        
        scheme = request.url.scheme
        host = request.headers.get("host", "localhost:8000")
        proto = request.headers.get("x-forwarded-proto", scheme)
        url = f"{proto}://{host}{request.url.path}"
        
        form_data = await request.form()
        form_dict = {k: v for k, v in form_data.items()}
        
        if not validator.validate(url, form_dict, x_twilio_signature):
            raise HTTPException(status_code=400, detail="Invalid Twilio signature")
    # Find the active user by checking all active numbers with robust matching
    active_users = db.query(User).filter(User.whatsapp_active == True).all()
    user = None
    for u in active_users:
        if u.whatsapp_phone and phone_numbers_match(u.whatsapp_phone, From):
            user = u
            break

    if not user:
        twiml_response = (
            "<Response>"
            "<Message>⚠️ Tu número no está registrado o activo en FRYD.\n"
            "Por favor ve a Configuración > Integración con WhatsApp en la aplicación web para conectar tu cuenta.</Message>"
            "</Response>"
        )
        return Response(content=twiml_response, media_type="application/xml")

    # Queue AI execution and message sending in the background
    background_tasks.add_task(process_whatsapp_message, From, Body, user.id)

    # Respond instantly to Twilio to prevent timeouts/retries
    return Response(content="<Response/>", media_type="application/xml")