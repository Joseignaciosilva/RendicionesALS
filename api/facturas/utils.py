import os

def rename_factura(instance, filename):
    """
    Genera una ruta dinámica para guardar facturas en una carpeta con el mes contable y el año concatenados,
    y el correlativo.
    """
    
    mesContable = instance.mesContable  # Se espera que sea un string (e.g., 'ENE', 'FEB')
    anioMesContable = instance.anioMesContable  # Se espera que sea un número entero (e.g., 2025)
    
    # Obtener el correlativo
    correlativo = instance.correlativo
        
    # Obtener la extensión del archivo
    file_extension = filename.split('.')[-1]
    
    # Nuevo nombre del archivo
    new_filename = f'{correlativo}.{file_extension}'
    
    # Combinar mesContable y anioMesContable con un guion bajo
    mes_anio_folder = f"{mesContable}_{anioMesContable}"
    
    # Ruta de la carpeta
    folder_path = os.path.join('facturas', mes_anio_folder)
    
    # Devolver la ruta completa
    return os.path.join(folder_path, new_filename)
