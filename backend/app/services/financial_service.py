import math
from typing import List, Dict, Any

class FinancialService:
    @staticmethod
    def calculate_revenue_breakdown(channels_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Calculates Net vs Gross Revenue, YouTube Platform Cut (45%), Tax Deductions (10%),
        and Royalty Split breakdown per channel/artist.
        """
        total_views = sum(ch.get("totalViews", 0) for ch in channels_data)
        
        # Base RPM calculation: Rp 18.500 per 1,000 views average
        gross_estimated_revenue = math.floor((total_views / 1000.0) * 18500) if total_views > 0 else 187500
        
        # YouTube Cut (45% for Longform & Shorts pool)
        youtube_platform_cut = math.floor(gross_estimated_revenue * 0.45)
        
        # Revenue after YouTube Cut
        channel_gross_revenue = gross_estimated_revenue - youtube_platform_cut
        
        # Tax & Processing Fees (10% Withholding Tax)
        tax_deduction = math.floor(channel_gross_revenue * 0.10)
        
        # Net Revenue Distributable
        net_distributable_revenue = channel_gross_revenue - tax_deduction
        
        # Royalty Split Breakdown (70% Creator / 20% Label / 10% Reserve Fund)
        creator_payout = math.floor(net_distributable_revenue * 0.70)
        label_payout = math.floor(net_distributable_revenue * 0.20)
        reserve_fund = net_distributable_revenue - creator_payout - label_payout
        
        channel_breakdowns = []
        for ch in channels_data:
            c_views = ch.get("totalViews", 0)
            c_share = (c_views / total_views) if total_views > 0 else (1.0 / max(len(channels_data), 1))
            c_gross = math.floor(gross_estimated_revenue * c_share)
            c_yt_cut = math.floor(c_gross * 0.45)
            c_net = math.floor((c_gross - c_yt_cut) * 0.90)
            
            channel_breakdowns.append({
                "channel_id": ch.get("channel_id", ""),
                "channel_name": ch.get("name", "YouTube Channel"),
                "total_views": c_views,
                "gross_revenue_idr": c_gross,
                "youtube_cut_idr": c_yt_cut,
                "net_payout_idr": c_net,
                "creator_share_idr": math.floor(c_net * 0.70),
                "label_share_idr": math.floor(c_net * 0.20)
            })
            
        return {
            "summary": {
                "total_views": total_views,
                "gross_estimated_revenue_idr": gross_estimated_revenue,
                "youtube_platform_cut_idr": youtube_platform_cut,
                "tax_deduction_idr": tax_deduction,
                "net_distributable_revenue_idr": net_distributable_revenue,
                "royalty_split": {
                    "creator_payout_idr": creator_payout,
                    "label_payout_idr": label_payout,
                    "reserve_fund_idr": reserve_fund
                }
            },
            "channels": channel_breakdowns
        }

    @staticmethod
    def generate_csv_report(financial_data: Dict[str, Any]) -> str:
        """
        Generates CSV format export report for financial accounting.
        """
        summary = financial_data.get("summary", {})
        lines = [
            "AUDIRA YT INTELLIGENCE MONITOR - FINANCIAL & ROYALTY REPORT",
            f"Generated At: {summary.get('generated_at', '2026-08-30')}",
            "",
            "EXECUTIVE FINANCIAL SUMMARY (IDR)",
            f"Total Views Monitored,{summary.get('total_views', 0)}",
            f"Gross Revenue Estimate (IDR),Rp {summary.get('gross_estimated_revenue_idr', 0):,}",
            f"YouTube Platform Share 45% (IDR),-Rp {summary.get('youtube_platform_cut_idr', 0):,}",
            f"Withholding Tax 10% (IDR),-Rp {summary.get('tax_deduction_idr', 0):,}",
            f"NET DISTRIBUTABLE REVENUE (IDR),Rp {summary.get('net_distributable_revenue_idr', 0):,}",
            "",
            "CHANNEL & ARTIST ROYALTY BREAKDOWN",
            "Channel Name,Total Views,Gross Revenue (IDR),YouTube Cut (IDR),Net Payout (IDR),Creator Share (70%),Label Share (20%)"
        ]
        
        for ch in financial_data.get("channels", []):
            lines.append(
                f'"{ch.get("channel_name")}",{ch.get("total_views")},Rp {ch.get("gross_revenue_idr"):,},-Rp {ch.get("youtube_cut_idr"):,},Rp {ch.get("net_payout_idr"):,},Rp {ch.get("creator_share_idr"):,},Rp {ch.get("label_share_idr"):,}'
            )
            
        return "\n".join(lines)
