<?php

namespace Database\Factories;

use App\Models\Contribution;
use App\Models\Dahira;
use App\Models\Member;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Contribution>
 */
class ContributionFactory extends Factory
{
    protected $model = Contribution::class;

    public function definition(): array
    {
        return [
            'dahira_id' => Dahira::factory(),
            'member_id' => Member::factory(),
            'type'      => fake()->randomElement(['cotisation', 'adiya', 'don', 'autre']),
            'amount'    => fake()->randomElement([2000, 5000, 10000, 15000]),
            'paid_at'   => fake()->dateTimeBetween('-6 months', 'now')->format('Y-m-d'),
            'status'    => 'paid',
        ];
    }
}
