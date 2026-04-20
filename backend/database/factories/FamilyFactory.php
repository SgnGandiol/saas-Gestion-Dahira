<?php

namespace Database\Factories;

use App\Models\Dahira;
use App\Models\Family;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Family>
 */
class FamilyFactory extends Factory
{
    protected $model = Family::class;

    public function definition(): array
    {
        return [
            'dahira_id'       => Dahira::factory(),
            'name'            => fake()->lastName() . ' Family',
            'address'         => fake()->streetAddress(),
            'neighborhood'    => fake()->word(),
            'phone'           => '+221 7' . fake()->numerify('# ### ## ##'),
            'capacity'        => fake()->numberBetween(15, 50),
            'is_available'    => true,
            'total_received'  => 0,
            'last_received_at'=> null,
        ];
    }

    public function unavailable(): static
    {
        return $this->state(['is_available' => false]);
    }

    public function withReceivedCount(int $count): static
    {
        return $this->state(['total_received' => $count]);
    }
}
