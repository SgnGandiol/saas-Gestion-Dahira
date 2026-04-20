<?php

namespace Database\Factories;

use App\Models\Dahira;
use App\Models\House;
use App\Models\Rotation;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Rotation>
 */
class RotationFactory extends Factory
{
    protected $model = Rotation::class;

    public function definition(): array
    {
        return [
            'dahira_id'      => Dahira::factory(),
            'house_id'       => House::factory(),
            'scheduled_date' => fake()->dateTimeBetween('-1 year', '+1 month')->format('Y-m-d'),
            'status'         => 'planned',
            'attendees_count'=> null,
            'notes'          => null,
        ];
    }

    public function done(): static
    {
        return $this->state(['status' => 'done']);
    }

    public function confirmed(): static
    {
        return $this->state(['status' => 'confirmed']);
    }

    public function cancelled(): static
    {
        return $this->state(['status' => 'cancelled']);
    }
}
