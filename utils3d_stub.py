"""
Заглушка для utils3d для тестирования на ARM Mac
"""

import torch
import numpy as np

class torch:
    @staticmethod
    def perspective_from_fov_xy(fov_x, fov_y, near, far):
        """Простая заглушка для перспективной проекции"""
        return torch.eye(4)
    
    @staticmethod
    def view_look_at(eye, center, up):
        """Простая заглушка для view matrix"""
        return torch.eye(4)
    
    class RastContext:
        def __init__(self, backend="cpu"):
            self.backend = backend
    
    @staticmethod
    def rasterize_triangle_faces(rastctx, vertices, faces, width, height, view=None, projection=None):
        """Простая заглушка для растеризации"""
        batch_size = vertices.shape[0]
        return {
            "face_id": torch.zeros((batch_size, height, width), dtype=torch.int32),
            "mask": torch.zeros((batch_size, height, width), dtype=torch.float32)
        }
    
    @staticmethod
    def compute_edges(faces):
        """Простая заглушка для вычисления рёбер"""
        num_faces = faces.shape[0]
        edges = torch.zeros((num_faces * 3, 2), dtype=torch.long)
        face2edge = torch.zeros((num_faces, 3), dtype=torch.long)
        edge_degrees = torch.zeros(num_faces * 3, dtype=torch.int32)
        return edges, face2edge, edge_degrees
    
    @staticmethod
    def compute_connected_components(faces, edges=None, face2edge=None):
        """Простая заглушка для вычисления связанных компонент"""
        return [torch.arange(faces.shape[0])]
    
    @staticmethod
    def compute_dual_graph(face2edge):
        """Простая заглушка для вычисления двойственного графа"""
        return torch.zeros((0, 2), dtype=torch.long), torch.zeros(0, dtype=torch.long)
    
    @staticmethod
    def compute_edge_connected_components(edges):
        """Простая заглушка для вычисления связанных компонент рёбер"""
        return [torch.arange(edges.shape[0])]
    
    @staticmethod
    def remove_unreferenced_vertices(faces, vertices):
        """Простая заглушка для удаления неиспользуемых вершин"""
        return faces, vertices
