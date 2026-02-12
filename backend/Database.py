import sqlite3
import json
from datetime import datetime
from typing import List, Dict, Optional

class Database:
    def __init__(self, db_name='plataforma_negocio.db'):
        self.db_name = db_name
        self.init_database()
    
    def get_connection(self):
        """Obtener conexión a la base de datos"""
        conn = sqlite3.connect(self.db_name)
        conn.row_factory = sqlite3.Row  # Para obtener resultados como diccionarios
        return conn
    
    def init_database(self):
        """Inicializar tablas de la base de datos"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Tabla para esquemas de negocios
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS esquemas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT UNIQUE NOT NULL,
                config TEXT NOT NULL,
                campos TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Tabla para datos de negocios
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS datos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                negocio TEXT NOT NULL,
                record_id INTEGER NOT NULL,
                contenido TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(negocio, record_id)
            )
        ''')
        
        # Índices para búsquedas rápidas
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_negocio ON datos(negocio)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_record_id ON datos(negocio, record_id)')
        
        conn.commit()
        conn.close()
    
    # ==================== ESQUEMAS ====================
    
    def get_esquemas(self) -> List[Dict]:
        """Obtener todos los esquemas"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT nombre, config, campos FROM esquemas ORDER BY nombre')
        esquemas = []
        
        for row in cursor.fetchall():
            esquemas.append({
                'nombre': row['nombre'],
                'config': json.loads(row['config']),
                'campos': json.loads(row['campos'])
            })
        
        conn.close()
        return esquemas
    
    def get_esquema(self, nombre: str) -> Optional[Dict]:
        """Obtener un esquema específico"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT nombre, config, campos FROM esquemas WHERE nombre = ?', (nombre,))
        row = cursor.fetchone()
        
        conn.close()
        
        if row:
            return {
                'nombre': row['nombre'],
                'config': json.loads(row['config']),
                'campos': json.loads(row['campos'])
            }
        return None
    
    def create_esquema(self, nombre: str, config: Dict, campos: List[Dict]) -> Dict:
        """Crear un nuevo esquema"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute(
                'INSERT INTO esquemas (nombre, config, campos) VALUES (?, ?, ?)',
                (nombre, json.dumps(config), json.dumps(campos))
            )
            conn.commit()
            
            return {
                'nombre': nombre,
                'config': config,
                'campos': campos
            }
        except sqlite3.IntegrityError:
            conn.close()
            raise ValueError(f'El esquema "{nombre}" ya existe')
        finally:
            conn.close()
    
    def delete_esquema(self, nombre: str) -> bool:
        """Eliminar un esquema y todos sus datos"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Eliminar datos asociados
        cursor.execute('DELETE FROM datos WHERE negocio = ?', (nombre,))
        
        # Eliminar esquema
        cursor.execute('DELETE FROM esquemas WHERE nombre = ?', (nombre,))
        
        deleted = cursor.rowcount > 0
        conn.commit()
        conn.close()
        
        return deleted
    
    # ==================== DATOS ====================
    
    def get_datos(self, negocio: str) -> List[Dict]:
        """Obtener todos los datos de un negocio"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            'SELECT contenido FROM datos WHERE negocio = ? ORDER BY record_id',
            (negocio,)
        )
        
        datos = [json.loads(row['contenido']) for row in cursor.fetchall()]
        
        conn.close()
        return datos
    
    def get_dato(self, negocio: str, record_id: int) -> Optional[Dict]:
        """Obtener un dato específico"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            'SELECT contenido FROM datos WHERE negocio = ? AND record_id = ?',
            (negocio, record_id)
        )
        
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return json.loads(row['contenido'])
        return None
    
    def create_dato(self, negocio: str, contenido: Dict) -> Dict:
        """Crear un nuevo dato"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        record_id = contenido.get('id')
        
        # Si no tiene ID, generar uno automático
        if not record_id:
            cursor.execute(
                'SELECT MAX(record_id) as max_id FROM datos WHERE negocio = ?',
                (negocio,)
            )
            row = cursor.fetchone()
            max_id = row['max_id'] if row['max_id'] is not None else 0
            record_id = max_id + 1
            contenido['id'] = record_id
        
        try:
            cursor.execute(
                'INSERT INTO datos (negocio, record_id, contenido) VALUES (?, ?, ?)',
                (negocio, record_id, json.dumps(contenido))
            )
            conn.commit()
            return contenido
        except sqlite3.IntegrityError:
            conn.close()
            raise ValueError(f'El ID {record_id} ya existe en {negocio}')
        finally:
            conn.close()
    
    def update_dato(self, negocio: str, record_id: int, contenido: Dict) -> Dict:
        """Actualizar un dato existente"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Asegurar que el ID no cambie
        contenido['id'] = record_id
        
        cursor.execute(
            '''UPDATE datos 
               SET contenido = ?, updated_at = CURRENT_TIMESTAMP 
               WHERE negocio = ? AND record_id = ?''',
            (json.dumps(contenido), negocio, record_id)
        )
        
        if cursor.rowcount == 0:
            conn.close()
            raise ValueError(f'No se encontró el registro {record_id} en {negocio}')
        
        conn.commit()
        conn.close()
        
        return contenido
    
    def delete_dato(self, negocio: str, record_id: int) -> bool:
        """Eliminar un dato"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            'DELETE FROM datos WHERE negocio = ? AND record_id = ?',
            (negocio, record_id)
        )
        
        deleted = cursor.rowcount > 0
        conn.commit()
        conn.close()
        
        return deleted
    
    def create_datos_bulk(self, negocio: str, datos_list: List[Dict]) -> List[Dict]:
        """Crear múltiples datos en una transacción"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        resultados = []
        
        try:
            for contenido in datos_list:
                record_id = contenido.get('id')
                
                # Si no tiene ID, generar uno
                if not record_id:
                    cursor.execute(
                        'SELECT MAX(record_id) as max_id FROM datos WHERE negocio = ?',
                        (negocio,)
                    )
                    row = cursor.fetchone()
                    max_id = row['max_id'] if row['max_id'] is not None else 0
                    record_id = max_id + 1
                    contenido['id'] = record_id
                
                cursor.execute(
                    'INSERT INTO datos (negocio, record_id, contenido) VALUES (?, ?, ?)',
                    (negocio, record_id, json.dumps(contenido))
                )
                
                resultados.append(contenido)
            
            conn.commit()
            return resultados
            
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()
    
    # ==================== UTILIDADES ====================
    
    def clear_all_data(self):
        """PELIGRO: Eliminar todos los datos (solo para desarrollo)"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM datos')
        cursor.execute('DELETE FROM esquemas')
        
        conn.commit()
        conn.close()
    
    def get_stats(self) -> Dict:
        """Obtener estadísticas de la base de datos"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT COUNT(*) as total FROM esquemas')
        total_esquemas = cursor.fetchone()['total']
        
        cursor.execute('SELECT COUNT(*) as total FROM datos')
        total_datos = cursor.fetchone()['total']
        
        cursor.execute('SELECT negocio, COUNT(*) as count FROM datos GROUP BY negocio')
        datos_por_negocio = {row['negocio']: row['count'] for row in cursor.fetchall()}
        
        conn.close()
        
        return {
            'total_esquemas': total_esquemas,
            'total_datos': total_datos,
            'datos_por_negocio': datos_por_negocio
        }