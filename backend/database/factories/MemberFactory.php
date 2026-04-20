<?php

namespace Database\Factories;

use App\Models\Dahira;
use App\Models\Member;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Member>
 */
class MemberFactory extends Factory
{
    protected $model = Member::class;

    public function definition(): array
    {
        return [
            'dahira_id'      => Dahira::factory(),
            'first_name'     => fake()->firstName(),
            'last_name'      => fake()->lastName(),
            'phone'          => '+221 7' . fake()->numerify('# ### ## ##'),
            'gender'         => fake()->randomElement(['male', 'female']),
            'is_active'      => true,
            'is_family_head' => false,
            'joined_at'      => fake()->dateTimeBetween('-5 years', 'now'),
        ];
    }

    public function active(): static
    {
        return $this->state(['is_active' => true]);
    }

    public function inactive(): static
    {
        return $this->state(['is_active' => false]);
    }

    public function familyHead(): static
    {
        return $this->state(['is_family_head' => true]);
    }
}
