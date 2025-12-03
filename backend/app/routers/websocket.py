from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query, status
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
        print(f"User {user_id} connected. Total connections: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket, user_id: int):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        print(f"User {user_id} disconnected. Total connections: {len(self.active_connections)}")
    
    async def send_personal_message(self, message: dict, user_id: int):
        if user_id in self.active_connections:
            disconnected = []
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    print(f"Failed to send to user {user_id}: {e}")
                    disconnected.append(connection)
            
            for conn in disconnected:
                if conn in self.active_connections[user_id]:
                    self.active_connections[user_id].remove(conn)
    
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
    user = None
    user_id = None
    
    try:
        payload = decode_token(token)
        if not payload:
            print("Invalid token")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        
        email = payload.get("sub")
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            print(f"User not found for email: {email}")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        
        user_id = user.id
        
        ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
        if not ticket:
            print(f"Ticket {ticket_id} not found")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        
        if user.id != ticket.student_id and user.id != ticket.counselor_id:
            if user.role.value not in ['admin']:
                print(f"User {user.id} not authorized for ticket {ticket_id}")
                await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
                return
        
        await manager.connect(websocket, user.id)
        
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
                    "email": user.email,
                    "full_name": user.full_name,
                    "role": user.role.value
                }
            }
            
            recipient_ids = [ticket.student_id]
            if ticket.counselor_id:
                recipient_ids.append(ticket.counselor_id)
            
            await manager.broadcast_to_ticket(response, recipient_ids)
            
    except WebSocketDisconnect:
        print(f"WebSocket disconnected for user {user_id}")
        if user_id:
            manager.disconnect(websocket, user_id)
    except Exception as e:
        print(f"WebSocket error: {e}")
        if user_id:
            manager.disconnect(websocket, user_id)
        try:
            await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
        except:
            pass
