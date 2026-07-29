<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Listing;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    public function checkout(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.listing_id' => ['required', 'uuid', 'exists:listings,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
        ]);

        $buyer = $request->user();

        $orders = DB::transaction(function () use ($validated, $buyer): array {
            $requested = collect($validated['items'])
                ->groupBy('listing_id')
                ->map(fn ($rows) => (int) collect($rows)->sum('quantity'));

            $listings = Listing::query()
                ->whereIn('id', $requested->keys())
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            abort_if($listings->count() !== $requested->count(), 422, 'Algunas publicaciones no existen.');

            $bySeller = [];

            foreach ($requested as $listingId => $qty) {
                /** @var Listing $listing */
                $listing = $listings[$listingId];

                abort_if($listing->user_id === $buyer->id, 422, 'No puedes comprar tus propias publicaciones.');
                abort_if($listing->status !== 'disponible', 422, 'Solo puedes comprar publicaciones disponibles.');
                abort_if($listing->quantity < $qty, 422, 'Cantidad solicitada no disponible.');

                $bySeller[$listing->user_id][] = [
                    'listing' => $listing,
                    'quantity' => $qty,
                ];
            }

            $createdOrders = [];

            foreach ($bySeller as $sellerId => $rows) {
                $total = collect($rows)->sum(function (array $row): float {
                    return ((float) $row['listing']->price) * ((int) $row['quantity']);
                });

                $currency = $rows[0]['listing']->currency;

                $order = Order::create([
                    'buyer_id' => $buyer->id,
                    'seller_id' => $sellerId,
                    'status' => 'pendiente',
                    'total' => $total,
                    'currency' => $currency,
                    'payment_status' => 'pendiente',
                ]);

                foreach ($rows as $row) {
                    /** @var Listing $listing */
                    $listing = $row['listing'];
                    $qty = (int) $row['quantity'];

                    $order->items()->create([
                        'listing_id' => $listing->id,
                        'price_at_purchase' => $listing->price,
                        'quantity' => $qty,
                    ]);

                    $listing->quantity -= $qty;
                    $listing->status = $listing->quantity === 0 ? 'reservado' : 'disponible';
                    $listing->save();
                }

                $createdOrders[] = $order;
            }

            return $createdOrders;
        });

        $payload = collect($orders)
            ->map(fn (Order $order): array => $this->formatOrder($order))
            ->values();

        return response()->json([
            'message' => 'Compra reservada correctamente',
            'orders' => $payload,
        ], 201);
    }

    public function history(Request $request): JsonResponse
    {
        $orders = Order::query()
            ->where('buyer_id', $request->user()->id)
            ->with([
                'seller:id,name',
                'items:id,order_id,listing_id,price_at_purchase,quantity',
                'items.listing:id,title,asset_type,status',
            ])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (Order $order): array => $this->formatOrder($order));

        return response()->json($orders->values());
    }

    private function formatOrder(Order $order): array
    {
        $order->loadMissing([
            'seller:id,name',
            'buyer:id,name',
            'items:id,order_id,listing_id,price_at_purchase,quantity',
            'items.listing:id,title,asset_type,status',
        ]);

        return [
            'id' => $order->id,
            'buyer' => $order->buyer,
            'seller' => $order->seller,
            'status' => $order->status,
            'payment_status' => $order->payment_status,
            'total' => (float) $order->total,
            'currency' => $order->currency,
            'items' => $order->items,
            'created_at' => $order->created_at,
            'updated_at' => $order->updated_at,
        ];
    }
}