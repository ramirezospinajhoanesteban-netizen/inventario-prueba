<?php

namespace App\Http\Controllers;

use App\Http\Requests\CategoryRequest;
use App\Models\Category;
use Illuminate\Http\JsonResponse;

class CategoryController extends Controller
{
    /**
     * Obtener todas las categorías.
     */
    public function index(): JsonResponse
    {
        $categories = Category::orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data' => $categories,
        ]);
    }

    /**
     * Crear una categoría.
     */
    public function store(CategoryRequest $request): JsonResponse
    {
        $category = Category::create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Categoría creada correctamente.',
            'data' => $category,
        ], 201);
    }

    /**
     * Obtener una categoría.
     */
    public function show(Category $category): JsonResponse
    {
        $category->load('products');

        return response()->json([
            'success' => true,
            'data' => $category,
        ]);
    }

    /**
     * Actualizar una categoría.
     */
    public function update(
        CategoryRequest $request,
        Category $category
    ): JsonResponse {
        $category->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Categoría actualizada correctamente.',
            'data' => $category,
        ]);
    }

    /**
     * Eliminar una categoría.
     */
    public function destroy(Category $category): JsonResponse
    {
        if ($category->products()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'No se puede eliminar una categoría que tiene productos asociados.',
            ], 422);
        }

        $category->delete();

        return response()->json([
            'success' => true,
            'message' => 'Categoría eliminada correctamente.',
        ]);
    }
}
