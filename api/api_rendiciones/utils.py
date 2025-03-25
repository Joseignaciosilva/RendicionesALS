from django.utils import timezone
import os

def rename_comprobante(instance, filename):
    
    rendidor_email = instance.idfondo.rendidor  # Acceder al campo 'rendidor' desde 'Fondo'
    
    rendidor_email = rendidor_email.replace('@alsglobal.com', '') # Asegurarse de que el correo tenga  
    rendidor_email = rendidor_email.replace('.', '-')             # caracteres válidos para una carpeta

    fondo_id = instance.idfondo.id   # Obtenemos el ID del fondo 
    current_time = timezone.now().strftime('%d-%m-%Y_%H%M%S') #y la fecha/hora actual
    
    file_extension = filename.split('.')[-1]  # Obtener la extensión del archivo
    
    new_filename = f'{fondo_id}_{current_time}.{file_extension}' # Generamos el nuevo nombre del archivo
    
    # Generamos la ruta completa con 'rendidor' y 'idfondo'
    folder_path = os.path.join('imagenes', rendidor_email, str(fondo_id))  # Carpeta por rendidor y fondo
    
    return os.path.join(folder_path, new_filename) # Devolvemos la ruta completa del archivo
