<?php

namespace Database\Factories;

use App\Models\Dahira;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Dahira>
 */
class DahiraFactory extends Factory
{
    protected $model = Dahira::class;

    public function definition(): array
    {
        $name = fake()->unique()->words(3, true);

        return [
            'name'        => ucwords($name),
            'slug'        => Str::slug($name),
            'city'        => fake()->city(),
            'country'     => 'SN',
            'is_active'   => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(['is_active' => false]);
    }
}
