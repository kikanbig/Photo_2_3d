"""
Заглушка для kaolin на случай, если настоящая библиотека не установлена
"""
import torch
import warnings

warnings.warn("Using kaolin stub - full kaolin functionality not available")

class KaolinStub:
    """Минимальная заглушка для kaolin"""
    
    class ops:
        class mesh:
            @staticmethod
            def index_vertices_by_faces(vertices, faces):
                """Заглушка для index_vertices_by_faces"""
                return vertices[faces]
            
            @staticmethod
            def face_normals(face_vertices):
                """Заглушка для face_normals"""
                v0, v1, v2 = face_vertices[:, 0], face_vertices[:, 1], face_vertices[:, 2]
                normals = torch.cross(v1 - v0, v2 - v0)
                return normals / torch.norm(normals, dim=-1, keepdim=True)
    
    class render:
        class lighting:
            @staticmethod
            def sg_direction_from_azimuth_elevation(azimuth, elevation):
                """Заглушка для sg_direction_from_azimuth_elevation"""
                return torch.tensor([0.0, 0.0, 1.0])
            
            class SgLightingParameters:
                def __init__(self, *args, **kwargs):
                    self.amplitude = kwargs.get('amplitude', torch.ones(3))
                    self.sharpness = kwargs.get('sharpness', torch.ones(1))
                    self.direction = kwargs.get('direction', torch.tensor([0.0, 0.0, 1.0]))
                
                @classmethod
                def from_sun(cls):
                    return cls()
        
        class easy_render:
            class RenderPass:
                render = 'render'
                albedo = 'albedo'
                diffuse = 'diffuse'
                normals = 'normals'
            
            @staticmethod
            def render_mesh(*args, **kwargs):
                """Заглушка для render_mesh"""
                warnings.warn("kaolin render_mesh stub called - returning dummy data")
                return {
                    'render': torch.zeros(512, 512, 3),
                    'albedo': torch.zeros(512, 512, 3),
                    'diffuse': torch.zeros(512, 512, 3),
                    'normals': torch.zeros(512, 512, 3),
                }
        
        class materials:
            class PBRMaterial:
                def __init__(self):
                    pass
    
    class io:
        class gltf:
            @staticmethod
            def import_mesh(path):
                """Заглушка для import_mesh из GLTF"""
                warnings.warn("kaolin GLTF import stub called")
                return None
        
        class obj:
            @staticmethod
            def import_mesh(path, with_materials=False):
                """Заглушка для import_mesh из OBJ"""
                warnings.warn("kaolin OBJ import stub called")
                return None
        
        class off:
            @staticmethod
            def import_mesh(path):
                """Заглушка для import_mesh из OFF"""
                warnings.warn("kaolin OFF import stub called")
                return None

# Экспортируем заглушку как kaolin
ops = KaolinStub.ops
render = KaolinStub.render
io = KaolinStub.io

