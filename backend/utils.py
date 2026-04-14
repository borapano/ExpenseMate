import string
import secrets

def generate_invite_code(length=6):
    """Generate a secure invite code (uppercase, no confusing characters)."""
    
    # Heqim karakteret konfuzuese (0, O, 1, I, L)
    characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    
    return ''.join(secrets.choice(characters) for _ in range(length))