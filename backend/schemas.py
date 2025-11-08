from pydantic import (
    BaseModel,
    Field,
    EmailStr,
    GetCoreSchemaHandler,
    GetJsonSchemaHandler,
)
from typing import Optional, List, Literal, Dict, Any, Union
from datetime import datetime
from bson import ObjectId
from enum import Enum
from pydantic_core import core_schema


# Custom ObjectId handler compatible with Pydantic v2
class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_core_schema__(
        cls, _source_type, _handler: GetCoreSchemaHandler
    ) -> core_schema.CoreSchema:
        # Use a plain validator; handle both str and ObjectId inputs
        return core_schema.no_info_plain_validator_function(cls.validate)

    @classmethod
    def validate(cls, v):
        # Accept already-constructed ObjectId
        if isinstance(v, ObjectId):
            return v
        # Accept strings (and bytes) that are valid ObjectId values
        if isinstance(v, (str, bytes)):
            s = v.decode() if isinstance(v, bytes) else v
            if ObjectId.is_valid(s):
                return ObjectId(s)
        raise ValueError("Invalid ObjectId")

    @classmethod
    def __get_pydantic_json_schema__(
        cls, core_schema_: core_schema.CoreSchema, handler: GetJsonSchemaHandler
    ) -> Dict[str, Any]:
        json_schema = handler(core_schema_)
        json_schema.update(type="string")
        return json_schema


# Task Category Enums
class TaskCategory(str, Enum):
    IMAGE_CLASSIFICATION = "image_classification"
    TEXT_CLASSIFICATION = "text_classification"
    OBJECT_DETECTION = "object_detection"
    NER = "named_entity_recognition"
    SENTIMENT_ANALYSIS = "sentiment_analysis"
    LLM_RESPONSE_GRADING = "generative_ai_llm_response_grading"
    CHATBOT_MODEL_ASSESSMENT = "generative_ai_chatbot_assessment"
    RESPONSE_SELECTION = "conversational_ai_response_selection"
    TEXT_SUMMARIZATION = "text_summarization"
    QA_EVALUATION = "qa_evaluation"


# User Schema
class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: Literal["admin", "manager", "annotator"]


class UserCreate(UserBase):
    password: str


class ManagerUser(UserBase):
    role: Literal["manager"] = "manager"
    paid: bool = False


class AnnotatorUser(UserBase):
    role: Literal["annotator"] = "annotator"
    skills: List[str] = []


class AdminUser(UserBase):
    role: Literal["admin"] = "admin"


class UserInDB(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    name: str
    email: EmailStr
    role: Literal["admin", "manager", "annotator"]
    paid: Optional[bool] = None  # Only for managers
    skills: Optional[List[str]] = None  # Only for annotators
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class UserResponse(BaseModel):
    id: str = Field(alias="_id")
    name: str
    email: EmailStr
    role: Literal["admin", "manager", "annotator"]
    paid: Optional[bool] = None
    skills: Optional[List[str]] = None
    created_at: datetime


# Project Schema
class ProjectCreate(BaseModel):
    details: str
    category: TaskCategory


class Project(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    manager_id: PyObjectId
    details: str
    category: TaskCategory  # Added category field
    task_ids: List[PyObjectId] = []
    is_completed: bool = False  # Track if project is marked as completed
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        use_enum_values = True


class ProjectResponse(BaseModel):
    id: str = Field(alias="_id")
    manager_id: str
    details: str
    category: TaskCategory
    task_ids: List[str] = []
    is_completed: bool = False
    created_at: datetime


# Task Data Models for different categories
class LLMResponseGradingData(BaseModel):
    """Data structure for LLM Response Grading tasks"""

    document: Union[str, List[str]]  # Can be single string or array of paragraphs
    summary: str
    prompt: Optional[str] = None  # Optional: The prompt used to generate the summary
    model_name: Optional[str] = None  # Optional: Which LLM generated this


class DialogueMessage(BaseModel):
    """Single message in a dialogue"""

    role: str  # "user" or "assistant"
    content: str


class ChatbotModelAssessmentData(BaseModel):
    """Data structure for Chatbot Model Assessment tasks"""

    messages: List[DialogueMessage]  # Conversation history
    model_name: Optional[str] = None  # Which chatbot model
    assessment_title: Optional[str] = "InstructGPT Assessment"


class ResponseSelectionData(BaseModel):
    """Data structure for Response Selection tasks"""

    dialogue: List[DialogueMessage]  # Conversation history leading to this point
    response_options: List[str]  # Multiple response options to choose from
    context: Optional[str] = None  # Additional context if needed


class ImageClassificationData(BaseModel):
    """Data structure for Image Classification tasks"""

    image_url: str
    labels: List[str]  # Available labels for classification


class TextClassificationData(BaseModel):
    """Data structure for Text Classification tasks"""

    text: str
    labels: List[str]


class ObjectDetectionData(BaseModel):
    """Data structure for Object Detection tasks"""

    image_url: str
    classes: List[str]  # Available object classes


class NERData(BaseModel):
    """Data structure for Named Entity Recognition tasks"""

    text: str
    entity_types: List[str]  # e.g., ["PERSON", "ORG", "LOCATION"]


# Annotation Models for different categories
class LLMResponseGradingAnnotation(BaseModel):
    """Annotation for LLM Response Grading"""

    rating: int = Field(..., ge=1, le=5)  # Rating from 1-5
    feedback: Optional[str] = None  # Optional textual feedback
    criteria_scores: Optional[Dict[str, int]] = (
        None  # e.g., {"accuracy": 4, "completeness": 5}
    )


class ChatbotModelAssessmentAnnotation(BaseModel):
    """Annotation for Chatbot Model Assessment"""

    likert_scale: int = Field(..., ge=1, le=7)  # Overall quality rating 1-7
    fails_to_follow: bool  # Fails to follow instruction/task
    inappropriate_for_customer: bool
    hallucination: bool
    satisfies_constraint: bool
    contains_sexual: bool
    contains_violent: bool
    encourages_violence: bool
    denigrates_protected_class: bool
    gives_harmful_advice: bool
    expresses_opinion: bool
    expresses_moral_judgment: bool
    additional_notes: Optional[str] = None


class ResponseSelectionAnnotation(BaseModel):
    """Annotation for Response Selection"""

    selected_response: int = Field(..., ge=1, le=3)  # Which response (1, 2, or 3)
    confidence: Optional[int] = Field(None, ge=1, le=5)  # Confidence in selection
    reasoning: Optional[str] = None  # Why this response was selected


class ImageClassificationAnnotation(BaseModel):
    """Annotation for Image Classification"""

    selected_label: str
    confidence: Optional[int] = Field(None, ge=1, le=5)


class TextClassificationAnnotation(BaseModel):
    """Annotation for Text Classification"""

    selected_label: str
    confidence: Optional[int] = Field(None, ge=1, le=5)


class BoundingBox(BaseModel):
    x: float
    y: float
    width: float
    height: float


class ObjectDetectionAnnotation(BaseModel):
    """Annotation for Object Detection"""

    objects: List[Dict[str, Any]]  # [{class: "car", bbox: {...}}, ...]


class NERAnnotation(BaseModel):
    """Annotation for NER"""

    entities: List[
        Dict[str, Any]
    ]  # [{text: "John", type: "PERSON", start: 0, end: 4}, ...]


# Task Completion Status
class TaskCompletionStatus(BaseModel):
    annotator_part: bool = False
    qa_part: bool = False


# Main Task Schema
class Task(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    project_id: PyObjectId
    category: TaskCategory

    # Task data - flexible structure based on category
    task_data: Union[
        LLMResponseGradingData,
        ChatbotModelAssessmentData,
        ResponseSelectionData,
        ImageClassificationData,
        TextClassificationData,
        ObjectDetectionData,
        NERData,
        Dict[str, Any],  # Fallback for custom categories
    ]

    # Annotation data - filled by annotator
    annotation: Optional[
        Union[
            LLMResponseGradingAnnotation,
            ChatbotModelAssessmentAnnotation,
            ResponseSelectionAnnotation,
            ImageClassificationAnnotation,
            TextClassificationAnnotation,
            ObjectDetectionAnnotation,
            NERAnnotation,
            Dict[str, Any],  # Fallback for custom categories
        ]
    ] = None

    # QA annotation - filled by QA reviewer
    qa_annotation: Optional[Dict[str, Any]] = None
    qa_feedback: Optional[str] = None

    completed_status: TaskCompletionStatus = Field(default_factory=TaskCompletionStatus)
    tag_task: Optional[str] = None  # Optional tag for filtering/grouping

    # Annotator assignment
    assigned_annotator_id: Optional[PyObjectId] = None
    assigned_qa_id: Optional[PyObjectId] = None

    # Return status and accumulated time
    is_returned: bool = False  # Whether task has been returned to annotator
    accumulated_time: Optional[float] = None  # Time spent before return (in seconds)

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    annotator_started_at: Optional[datetime] = None
    annotator_completed_at: Optional[datetime] = None
    qa_started_at: Optional[datetime] = None
    qa_completed_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        use_enum_values = True


# Invite Schema
class InviteCreate(BaseModel):
    user_id: str


class Invite(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    project_id: PyObjectId
    user_id: PyObjectId
    accepted_status: bool = False
    invited_at: datetime = Field(default_factory=datetime.utcnow)
    accepted_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class InviteResponse(BaseModel):
    id: str = Field(alias="_id")
    project_id: str
    user_id: str
    accepted_status: bool
    invited_at: datetime
    accepted_at: Optional[datetime] = None


# Manager Project Schema
class ManagerProject(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    project_id: PyObjectId
    invite_id: PyObjectId
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


# Project Working Schema - Tracks annotator assignments
class AnnotatorTaskAssignment(BaseModel):
    annotator_id: PyObjectId
    task_ids: List[PyObjectId] = []
    assigned_at: datetime = Field(default_factory=datetime.utcnow)


class ProjectWorking(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    project_id: PyObjectId
    annotator_assignments: List[AnnotatorTaskAssignment] = []
    qa_annotator_ids: List[PyObjectId] = (
        []
    )  # Annotators designated as QA for this project
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


# Annotator Tasks Schema - Tracks completion times
class TaskCompletion(BaseModel):
    task_id: PyObjectId
    annotator_id: PyObjectId
    completion_time: Optional[float] = None  # Time in seconds from frontend timer


class AnnotatorTasks(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    project_id: PyObjectId
    task_completions: List[TaskCompletion] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


# Request/Response helper schemas
class TaskCreate(BaseModel):
    category: TaskCategory
    task_data: Dict[str, Any]
    tag_task: Optional[str] = None


class TaskResponse(BaseModel):
    id: str = Field(alias="_id")
    project_id: str
    category: TaskCategory
    task_data: Dict[str, Any]
    annotation: Optional[Dict[str, Any]] = None
    qa_annotation: Optional[Dict[str, Any]] = None
    qa_feedback: Optional[str] = None
    completed_status: TaskCompletionStatus
    tag_task: Optional[str] = None
    assigned_annotator_id: Optional[str] = None
    assigned_qa_id: Optional[str] = None
    is_returned: bool = False
    accumulated_time: Optional[float] = None
    created_at: datetime
    annotator_started_at: Optional[datetime] = None
    annotator_completed_at: Optional[datetime] = None
    qa_started_at: Optional[datetime] = None
    qa_completed_at: Optional[datetime] = None


class AssignTaskRequest(BaseModel):
    annotator_id: Optional[str] = None
    qa_id: Optional[str] = None


class SubmitAnnotationRequest(BaseModel):
    annotation: Dict[str, Any]
    completion_time: Optional[float] = None  # Time in seconds from frontend timer


class SubmitQARequest(BaseModel):
    qa_annotation: Dict[str, Any]
    qa_feedback: Optional[str] = None


# Authentication schemas
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
