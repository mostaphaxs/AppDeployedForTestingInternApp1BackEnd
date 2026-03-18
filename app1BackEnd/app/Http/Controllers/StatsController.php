<?php

namespace App\Http\Controllers;

use App\Models\Terrain;
use App\Models\payments;
use App\Models\Client;
use App\Models\Charge;
use App\Models\ContractorPayment;
use App\Models\Bien;
use Illuminate\Http\JsonResponse;

class StatsController extends Controller
{
    /**
     * Get global stats for the dashboard.
     */
    public function index(): JsonResponse
    {
        // 1. Total Investissement (Sum of all Terrain totals)
        $totalInvested = Terrain::sum('total');

        // 2. Total Encaissements (Sum of payments minus refunds)
        $totalEncaissements = payments::selectRaw('SUM(CAST(amount AS DECIMAL(15,2)) - CAST(COALESCE(refund_amount, 0) AS DECIMAL(15,2))) as net_total')
            ->value('net_total') ?? 0;

        // 3. Total Réservations (Count of clients)
        $totalReservations = Client::count();

        // 4. Charges Bureau (Sum of specific charge columns)
        $chargesBureau = Charge::selectRaw('
            SUM(frais_tel + internet + loyer_bureau + fournitures_bureau + employes_bureau + impots + gasoil) as total
        ')->value('total') ?? 0;

        // 5. Charges Intervenants (Sum of payments to Intervenants)
        $chargesIntervenants = ContractorPayment::where('payable_type', 'App\Models\Intervenant')
            ->sum('amount');

        // 6. Charges Contractors (Sum of payments to Contractors)
        $chargesContractors = ContractorPayment::where('payable_type', 'App\Models\Contractor')
            ->sum('amount');

        // 7. Total Global (Investissement + All Charges)
        $totalCharges = $chargesBureau + $chargesIntervenants + $chargesContractors;
        $coutGlobal = $totalInvested + $totalCharges;

        // 8. Detail: Property Status
        $biensStatus = Bien::select('statut', \DB::raw('count(*) as count'))
            ->groupBy('statut')
            ->pluck('count', 'statut')
            ->toArray();

        // 9. Detail: Recent Clients
        $recentClients = Client::with('bien')
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        // 10. Detail: Recent Payments
        $recentPayments = payments::with(['client.bien'])
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        return response()->json([
            'investissement' => (float) $totalInvested,
            'encaissements' => (float) $totalEncaissements,
            'reservations' => $totalReservations,
            'charges' => (float) $totalCharges,
            'charges_details' => [
                'bureau' => (float) $chargesBureau,
                'intervenants' => (float) $chargesIntervenants,
                'contractors' => (float) $chargesContractors,
            ],
            'cout_global' => (float) $coutGlobal,
            'biens_status' => $biensStatus,
            'recent_clients' => $recentClients,
            'recent_payments' => $recentPayments,
        ]);
    }
}
