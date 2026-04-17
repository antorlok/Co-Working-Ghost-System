class UserAlreadyExistsError(Exception):
    """Lanzada cuando se intenta registrar un correo que ya existe en la base de datos."""
    pass

class UserNotFoundError(Exception):
    """Lanzada cuando un usuario no es encontrado por su ID."""
    pass
