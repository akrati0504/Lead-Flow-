<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LeadResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'customer_name' => $this->customer_name,
            'phone' => $this->phone,
            'email' => $this->email,
            'company_name' => $this->company_name,
            'description' => $this->description,
            'status' => $this->status,
            'assigned_to' => $this->assigned_to,
            'assigned_employee' => $this->whenLoaded('assignedEmployee', function () {
                return $this->assignedEmployee ? [
                    'id' => $this->assignedEmployee->id,
                    'name' => $this->assignedEmployee->name,
                    'email' => $this->assignedEmployee->email,
                    'role' => $this->assignedEmployee->role,
                ] : null;
            }),
            'created_by' => $this->created_by,
            'creator' => $this->whenLoaded('creator', function () {
                return $this->creator ? [
                    'id' => $this->creator->id,
                    'name' => $this->creator->name,
                    'email' => $this->creator->email,
                    'role' => $this->creator->role,
                ] : null;
            }),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}

