<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_and_get_token(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Yami Yugi',
            'email' => 'yami@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'profile_type' => 'duelista',
            'display_name' => 'King of Games',
        ]);

        $response
            ->assertCreated()
            ->assertJsonStructure([
                'message',
                'token',
                'token_type',
                'user' => ['id', 'name', 'email'],
                'profile' => ['id', 'user_id', 'type', 'display_name'],
            ]);

        $this->assertDatabaseHas('users', ['email' => 'yami@example.com']);
        $this->assertDatabaseHas('profiles', [
            'type' => 'duelista',
            'display_name' => 'King of Games',
        ]);
    }

    public function test_user_can_login_and_logout(): void
    {
        $user = User::factory()->create([
            'email' => 'kaiba@example.com',
            'password' => 'blueeyes123',
        ]);

        $login = $this->postJson('/api/auth/login', [
            'email' => 'kaiba@example.com',
            'password' => 'blueeyes123',
        ]);

        $login
            ->assertOk()
            ->assertJsonStructure(['token', 'user' => ['id', 'email']]);

        $token = $login->json('token');

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/auth/logout')
            ->assertOk()
            ->assertJson(['message' => 'Logout exitoso']);

        $this->assertCount(0, $user->fresh()->tokens);
    }

    public function test_demo_accounts_are_created_for_each_profile_type(): void
    {
        $response = $this->postJson('/api/auth/demo-accounts');

        $response
            ->assertOk()
            ->assertJsonStructure([
                'message',
                'accounts' => [
                    ['email', 'password', 'type'],
                    ['email', 'password', 'type'],
                ],
            ]);

        $this->assertDatabaseHas('users', ['email' => 'demo.duelista@yugiohtracker.test']);
        $this->assertDatabaseHas('profiles', ['type' => 'duelista']);
        $this->assertDatabaseHas('users', ['email' => 'demo.tienda@yugiohtracker.test']);
        $this->assertDatabaseHas('profiles', ['type' => 'tienda']);
    }

    public function test_demo_credentials_can_log_in_and_create_the_account(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'demo.duelista@yugiohtracker.test',
            'password' => 'Demo1234!',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('profile.type', 'duelista');

        $this->assertDatabaseHas('users', ['email' => 'demo.duelista@yugiohtracker.test']);
        $this->assertDatabaseHas('profiles', ['type' => 'duelista']);
    }
}