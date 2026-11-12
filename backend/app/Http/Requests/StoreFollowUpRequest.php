<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreFollowUpRequest extends FormRequest
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
            'lead_id' => [
                'required',
                'integer',
            ],
            'follow_up_date' => ['required', 'date'],
            'remarks' => ['required', 'string'],
            'next_follow_up_date' => ['nullable', 'date'],
        ];

        if ($user && $user->role === 'employee') {
            // Employee can only add follow-ups to leads currently assigned to them
            $rules['lead_id'][] = Rule::exists('leads', 'id')->where(function ($query) use ($user) {
                $query->where('assigned_to', $user->id);
            });
        } else {
            // Admin can add follow-ups to any existing lead
            $rules['lead_id'][] = Rule::exists('leads', 'id');
        }

        return $rules;
    }

    /**
     * Custom validation error messages.
     */
    public function messages(): array
    {
        return [
            'lead_id.exists' => 'The selected lead does not exist or is not assigned to you.',
        ];
    }
}

