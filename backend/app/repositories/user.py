from typing import Optional
from sqlalchemy.orm import Session
from app.repositories.base import BaseRepository
from app.models.all_models import User, RefreshSession
from app.core.security import get_password_hash
from app.schemas.auth import UserCreate
import datetime

class UserRepository(BaseRepository[User]):
    def get_by_email(self, db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email).first()

    def create_user(self, db: Session, user_in: UserCreate) -> User:
        db_user = User(
            name=user_in.name,
            email=user_in.email,
            hashed_password=get_password_hash(user_in.password),
            role=user_in.role or "student",
            streak=0,
            xp=0,
            last_active_date=datetime.datetime.utcnow()
        )
        return self.create(db, obj_in=db_user)

    def update_streak_and_xp(self, db: Session, user: User, xp_gain: int) -> User:
        user.xp += xp_gain
        today = datetime.date.today()
        last_active = user.last_active_date.date()
        
        if last_active == today - datetime.timedelta(days=1):
            user.streak += 1
        elif last_active < today - datetime.timedelta(days=1):
            user.streak = 1
        
        user.last_active_date = datetime.datetime.utcnow()
        db.commit()
        db.refresh(user)
        return user

    # Refresh Session CRUD
    def create_refresh_session(self, db: Session, user_id: int, refresh_token: str, expires_at: datetime.datetime) -> RefreshSession:
        db_session = RefreshSession(
            user_id=user_id,
            refresh_token=refresh_token,
            expires_at=expires_at,
            is_revoked=False
        )
        db.add(db_session)
        db.commit()
        db.refresh(db_session)
        return db_session

    def get_refresh_session(self, db: Session, token: str) -> Optional[RefreshSession]:
        return db.query(RefreshSession).filter(
            RefreshSession.refresh_token == token,
            RefreshSession.is_revoked == False,
            RefreshSession.expires_at > datetime.datetime.utcnow()
        ).first()

    def revoke_refresh_session(self, db: Session, token: str) -> None:
        session = db.query(RefreshSession).filter(RefreshSession.refresh_token == token).first()
        if session:
            session.is_revoked = True
            db.commit()

    def log_user_session(self, db: Session, user_id: int, device: str, browser: str, ip: str) -> None:
        from app.models.all_models import UserSession
        session_log = UserSession(
            user_id=user_id,
            device=device,
            browser=browser,
            ip=ip
        )
        db.add(session_log)
        db.commit()

user_repo = UserRepository(User)
