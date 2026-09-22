# app/utils/archivos.py

FIRMAS = (
    b"\xff\xd8\xff",       # JPEG / JPG
    b"\x89PNG\r\n\x1a\n",  # PNG
    b"RIFF",               # WebP (RIFF....WEBP)
)


def parece_imagen(contenido: bytes) -> bool:
    """
    Valida la firma real de los primeros bytes del archivo (magic bytes).
    Retorna True si el contenido inicia con alguna de las firmas permitidas (JPG, PNG, WebP).
    """
    if not contenido:
        return False
    return contenido.startswith(FIRMAS)
