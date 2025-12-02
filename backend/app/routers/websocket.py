from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from sqlalchemy.orm import Session
from typing import Dict, List
from app.core.database import get_db
from app.core.security import decode_token
from app.models.models import User, Ticket, Message
import json
from datetime import datetime

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
    
    def disconnect(self, websocket: WebSocket, user_id: int):
        if user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
    
    async def send_personal_message(self, message: dict, user_id: int):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except:
                    pass
    
    async def broadcast_to_ticket(self, message: dict, user_ids: List[int]):
        for user_id in user_ids:
            await self.send_personal_message(message, user_id)

manager = ConnectionManager()

@router.websocket("/ws/chat/{ticket_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    ticket_id: int,
    token: str = Query(...),
    db: Session = Depends(get_db)
):
    payload = decode_token(token)
    if not payload:
        await websocket.close(code=1008)
        return
    
    username = payload.get("sub")
    user = db.query(User).filter(User.username == username).first()
    
    if not user:
        await websocket.close(code=1008)
        return
    
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        await websocket.close(code=1008)
        return
    
    if user.id != ticket.student_id and user.id != ticket.counselor_id:
        if user.role.value not in ['admin']:
            await websocket.close(code=1008)
            return
    
    await manager.connect(websocket, user.id)
    
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            new_message = Message(
                ticket_id=ticket_id,
                sender_id=user.id,
                message=message_data.get("message", ""),
                created_at=datetime.utcnow()
            )
            
            db.add(new_message)
            db.commit()
            db.refresh(new_message)
            
            response = {
                "id": new_message.id,
                "ticket_id": new_message.ticket_id,
                "sender_id": new_message.sender_id,
                "message": new_message.message,
                "created_at": new_message.created_at.isoformat(),
                "sender": {
                    "id": user.id,
                    "username": user.username,
                    "full_name": user.full_name,
                    "role": user.role.value
                }
            }
            
            recipient_ids = [ticket.student_id]
            if ticket.counselor_id:
                recipient_ids.append(ticket.counselor_id)
            
            await manager.broadcast_to_ticket(response, recipient_ids)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, user.id)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket, user.id)