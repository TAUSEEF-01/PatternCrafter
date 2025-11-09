"""Shared utilities and helper functions for routes"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict, Any
from bson import ObjectId

import database
from schemas import UserInDB, TaskCategory
from schemas import (
    LLMResponseGradingData,
    ChatbotModelAssessmentData,
    ResponseSelectionData,
    ImageClassificationData,
    TextClassificationData,
    ObjectDetectionData,
    NERData,
    LLMResponseGradingAnnotation,
    ChatbotModelAssessmentAnnotation,
    ResponseSelectionAnnotation,
    ImageClassificationAnnotation,
    TextClassificationAnnotation,
    ObjectDetectionAnnotation,
    NERAnnotation,
)
from auth import verify_token

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """Get current authenticated user"""
    token = credentials.credentials
    email = verify_token(token)
    if email is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = await database.users_collection.find_one({"email": email})
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found"
        )

    return UserInDB(**user)


# Helpers for category-specific validation
DATA_MODEL_BY_CATEGORY = {
    TaskCategory.LLM_RESPONSE_GRADING: LLMResponseGradingData,
    TaskCategory.CHATBOT_MODEL_ASSESSMENT: ChatbotModelAssessmentData,
    TaskCategory.RESPONSE_SELECTION: ResponseSelectionData,
    TaskCategory.IMAGE_CLASSIFICATION: ImageClassificationData,
    TaskCategory.TEXT_CLASSIFICATION: TextClassificationData,
    TaskCategory.OBJECT_DETECTION: ObjectDetectionData,
    TaskCategory.NER: NERData,
}

ANNOTATION_MODEL_BY_CATEGORY = {
    TaskCategory.LLM_RESPONSE_GRADING: LLMResponseGradingAnnotation,
    TaskCategory.CHATBOT_MODEL_ASSESSMENT: ChatbotModelAssessmentAnnotation,
    TaskCategory.RESPONSE_SELECTION: ResponseSelectionAnnotation,
    TaskCategory.IMAGE_CLASSIFICATION: ImageClassificationAnnotation,
    TaskCategory.TEXT_CLASSIFICATION: TextClassificationAnnotation,
    TaskCategory.OBJECT_DETECTION: ObjectDetectionAnnotation,
    TaskCategory.NER: NERAnnotation,
}


# Generic helpers to convert Mongo docs with ObjectIds into response-friendly dicts
def _stringify_object_ids(value):
    if isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, list):
        return [_stringify_object_ids(v) for v in value]
    if isinstance(value, dict):
        return {k: _stringify_object_ids(v) for k, v in value.items()}
    return value


def as_response(model_cls, doc: Dict[str, Any]):
    """Return an instance of model_cls with all ObjectIds converted to strings and aliases preserved."""
    data = _stringify_object_ids(doc)
    return model_cls(**data)
