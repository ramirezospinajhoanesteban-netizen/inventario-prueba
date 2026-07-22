<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'code' => [
                'required',
                'string',
                'max:20',
                'alpha_num',
                Rule::unique('products', 'code')->ignore($this->product),
            ],

            'name' => [
                'required',
                'string',
                'max:150',
            ],

            'status' => [
                'required',
                'boolean',
            ],

            'description' => [
                'required',
                'string',
                'max:500',
            ],

            'category_id' => [
                'required',
                'integer',
                'exists:categories,id',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'code.required' => 'El código del producto es obligatorio.',
            'code.max' => 'El código no puede superar los 20 caracteres.',
            'code.alpha_num' => 'El código solo puede contener letras y números.',
            'code.unique' => 'El código del producto ya existe.',

            'name.required' => 'El nombre del producto es obligatorio.',
            'name.max' => 'El nombre no puede superar los 150 caracteres.',

            'status.required' => 'El estado del producto es obligatorio.',
            'status.boolean' => 'El estado debe ser activo o inactivo.',

            'description.required' => 'La descripción es obligatoria.',
            'description.max' => 'La descripción no puede superar los 500 caracteres.',

            'category_id.required' => 'La categoría es obligatoria.',
            'category_id.exists' => 'La categoría seleccionada no existe.',
        ];
    }
}
