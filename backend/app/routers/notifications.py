from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from typing import Dict, List
from app.core.database import get_db
from app.core.security import decode_token
from app.models.models import User
import json

router = APIRouter()

class NotificationManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        print(f"User {user_id} connected to notifications. Total connections: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket, user_id: int):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        print(f"User {user_id} disconnected from notifications")
    
    async def send_to_user(self, user_id: int, message: dict):
        if user_id in self.active_connections:
            disconnected = []
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except:
                    disconnected.append(connection)
            
            for conn in disconnected:
                if conn in self.active_connections[user_id]:
                    self.active_connections[user_id].remove(conn)
    
    async def broadcast_to_role(self, role: str, message: dict, db: Session):
        users = db.query(User).filter(User.role == role, User.is_active == True).all()
        for user in users:
            await self.send_to_user(user.id, message)

notification_manager = NotificationManager()

@router.websocket("/ws/notifications")
async def websocket_notifications(
    websocket: WebSocket,
    token: str,
    db: Session = Depends(get_db)
):
    user = None
    user_id = None
    
    try:
        payload = decode_token(token)
        if not payload:
            await websocket.close(code=1008)
            return
        
        email = payload.get("sub")
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            await websocket.close(code=1008)
            return
        
        user_id = user.id
        await notification_manager.connect(websocket, user.id)
        
        # Keep connection alive
        while True:
            data = await websocket.receive_text()
            # Echo back to confirm connection is alive
            await websocket.send_json({"type": "ping", "status": "alive"})
            
    except WebSocketDisconnect:
        if user_id:
            notification_manager.disconnect(websocket, user_id)
    except Exception as e:
        print(f"Notification WebSocket error: {e}")
        if user_id:
            notification_manager.disconnect(websocket, user_id)
