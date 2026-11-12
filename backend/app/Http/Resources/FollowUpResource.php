<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FollowUpResource extends JsonResource
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
            'lead_id' => $this->lead_id,
            'lead' => $this->whenLoaded('lead', function () {
                return $this->lead ? [
                    'id' => $this->lead->id,
                    'customer_name' => $this->lead->customer_name,
                    'phone' => $this->lead->phone,
                    'email' => $this->lead->email,
                    'company_name' => $this->lead->company_name,
                    'status' => $this->lead->status,
                    'assigned_to' => $this->lead->assigned_to,
                ] : null;
            }),
            'follow_up_date' => $this->follow_up_date?->toIso8601String(),
            'remarks' => $this->remarks,
            'next_follow_up_date' => $this->next_follow_up_date?->toIso8601String(),
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

