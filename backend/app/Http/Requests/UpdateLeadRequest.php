<?php

namespace App\Http\Requests;

use App\Models\Lead;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateLeadRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $user = $this->user();

        $rules = [
            'customer_name' => ['sometimes', 'required', 'string', 'max:255'],
            'phone' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'company_name' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['sometimes', 'required', 'string', Rule::in(Lead::ALLOWED_STATUSES)],
        ];

        // Only Admin can assign/reassign leads to active employees or set to null
        if ($user && $user->role === 'admin') {
            $rules['assigned_to'] = [
                'nullable',
                Rule::exists('users', 'id')->where(function ($query) {
                    $query->where('role', 'employee')->where('is_active', true);
                }),
            ];
        }

        return $rules;
    }
}

