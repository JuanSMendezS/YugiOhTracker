<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'profile_type' => ['required', 'string', 'in:duelista,tienda'],
            'display_name' => ['nullable', 'string', 'max:255'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
        ]);

        $profile = Profile::create([
            'user_id' => $user->id,
            'type' => $validated['profile_type'],
            'display_name' => $validated['display_name'] ?? $validated['name'],
        ]);

        $token = $this->createTokenForUser($user);
        Auth::login($user);
        $request->session()->regenerate();

        return response()->json([
            'message' => 'Registro exitoso',
            'token' => $token->plainTextToken,
            'token_type' => 'Bearer',
            'user' => $user,
            'profile' => $profile,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
            'remember' => ['sometimes', 'boolean'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user) {
            $user = $this->ensureDemoAccount($validated['email'], $validated['password']);
        }

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Las credenciales no son correctas.'],
            ]);
        }

        $token = $this->createTokenForUser($user);
        Auth::login($user, (bool) ($validated['remember'] ?? false));
        $request->session()->regenerate();

        return response()->json([
            'message' => 'Login exitoso',
            'token' => $token->plainTextToken,
            'token_type' => 'Bearer',
            'user' => $user,
            'profile' => $user->profile,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->tokens()->delete();

        if ($request->hasSession()) {
            $request->session()->forget('login_web_compat');
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        Auth::guard('web')->logout();

        return response()->json([
            'message' => 'Logout exitoso',
        ]);
    }

    public function demoAccounts(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'profile_type' => ['nullable', 'string', 'in:duelista,tienda'],
            'login' => ['sometimes', 'boolean'],
        ]);

        $demoProfiles = [
            [
                'type' => 'duelista',
                'name' => 'Duelista Demo',
                'email' => 'demo.duelista@yugiohtracker.test',
                'password' => 'Demo1234!',
                'display_name' => 'Duelista de prueba',
            ],
            [
                'type' => 'tienda',
                'name' => 'Tienda Demo',
                'email' => 'demo.tienda@yugiohtracker.test',
                'password' => 'Demo1234!',
                'display_name' => 'Tienda de prueba',
            ],
        ];

        $accounts = [];
        foreach ($demoProfiles as $seed) {
            $user = User::firstOrCreate(
                ['email' => $seed['email']],
                ['name' => $seed['name'], 'password' => $seed['password']]
            );

            $profile = $user->profile()->first();
            if (! $profile) {
                $profile = Profile::create([
                    'user_id' => $user->id,
                    'type' => $seed['type'],
                    'display_name' => $seed['display_name'],
                ]);
            } elseif ($profile->type !== $seed['type']) {
                $profile->update([
                    'type' => $seed['type'],
                    'display_name' => $seed['display_name'],
                ]);
            }

            $accounts[] = [
                'email' => $user->email,
                'password' => $seed['password'],
                'type' => $profile->type,
            ];
        }

        $shouldLogin = (bool) ($validated['login'] ?? true);
        $requestedType = $validated['profile_type'] ?? null;
        if ($shouldLogin) {
            $selectedAccount = collect($accounts)->firstWhere('type', $requestedType) ?? $accounts[0] ?? null;
            if ($selectedAccount) {
                $user = User::where('email', $selectedAccount['email'])->first();
                if ($user) {
                    Auth::login($user);
                    $request->session()->regenerate();
                }
            }
        }

        return response()->json([
            'message' => 'Cuentas demo listas',
            'accounts' => $accounts,
            'active_profile' => $requestedType ?? $accounts[0]['type'] ?? null,
        ]);
    }

    private function createTokenForUser(User $user)
    {
        return $user->createToken('auth-token');
    }

    private function ensureDemoAccount(string $email, string $password): ?User
    {
        $demoProfiles = [
            'demo.duelista@yugiohtracker.test' => [
                'type' => 'duelista',
                'name' => 'Duelista Demo',
                'display_name' => 'Duelista de prueba',
            ],
            'demo.tienda@yugiohtracker.test' => [
                'type' => 'tienda',
                'name' => 'Tienda Demo',
                'display_name' => 'Tienda de prueba',
            ],
        ];

        if (! array_key_exists($email, $demoProfiles)) {
            return null;
        }

        if ($password !== 'Demo1234!') {
            return null;
        }

        $seed = $demoProfiles[$email];
        $user = User::firstOrCreate(
            ['email' => $email],
            ['name' => $seed['name'], 'password' => $password]
        );

        $profile = $user->profile()->first();
        if (! $profile) {
            Profile::create([
                'user_id' => $user->id,
                'type' => $seed['type'],
                'display_name' => $seed['display_name'],
            ]);
        } elseif ($profile->type !== $seed['type']) {
            $profile->update([
                'type' => $seed['type'],
                'display_name' => $seed['display_name'],
            ]);
        }

        return $user;
    }
}