from sqlmodel import Session, select
from sqlalchemy.exc import IntegrityError
from app.models.models import User
from app.core.exceptions import UserAlreadyExistsError

# El repositorio aísla la lógica de acceso a datos, manteniendo el servicio independiente del ORM/DB
class UserRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_all(self) -> list[User]:
        statement = select(User)
        return self.session.exec(statement).all()

    def get_by_id(self, user_id: int) -> User | None:
        return self.session.get(User, user_id)

    def get_by_email(self, email: str) -> User | None:
        statement = select(User).where(User.email == email)
        return self.session.exec(statement).first()

    def create(self, user: User) -> User:
        self.session.add(user)
        try:
            self.session.commit()
            self.session.refresh(user)
            return user
        except IntegrityError:
            self.session.rollback()
            raise UserAlreadyExistsError()

    def update(self, user: User) -> User:
        self.session.add(user)
        try:
            self.session.commit()
            self.session.refresh(user)
            return user
        except IntegrityError:
            self.session.rollback()
            raise UserAlreadyExistsError()

    def delete(self, user: User) -> None:
        self.session.delete(user)
        self.session.commit()
