"use client";

interface ReportTabProps {
  modelId: string;
}

export function ReportTab({ modelId: _modelId }: ReportTabProps) {
  return (
    <div className="space-y-8">
      <div className="card p-8">
        <h2 className="text-3xl font-bold text-navy mb-2">5-Year Financial Forecast</h2>
        <p className="text-navy/60 mb-8">Board-ready financial summary for investor presentations</p>

        <div className="space-y-8">
          <section>
            <h3 className="text-xl font-semibold text-navy mb-4">Executive Summary</h3>
            <div className="space-y-2 text-navy/80">
              <p>
                This financial model projects the financial performance of [Company Name] over the next five years based on conservative assumptions about market growth, customer acquisition, and operational efficiency.
              </p>
              <p>
                Key highlights include revenue growing from $[X] in Year 1 to $[Y] by Year 5, with profitability expected to be achieved in [Quarter/Month] of Year [X].
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-navy mb-4">Key Assumptions</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="border-l-4 border-gold pl-4">
                <p className="text-sm text-navy/60">Starting Monthly Revenue</p>
                <p className="text-2xl font-bold text-navy">$10,000</p>
              </div>
              <div className="border-l-4 border-gold pl-4">
                <p className="text-sm text-navy/60">Monthly Growth Rate</p>
                <p className="text-2xl font-bold text-navy">10%</p>
              </div>
              <div className="border-l-4 border-gold pl-4">
                <p className="text-sm text-navy/60">Gross Margin Target</p>
                <p className="text-2xl font-bold text-navy">70%</p>
              </div>
              <div className="border-l-4 border-gold pl-4">
                <p className="text-sm text-navy/60">Breakeven Timeline</p>
                <p className="text-2xl font-bold text-navy">Month 24</p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-navy mb-4">Use of Funds</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-navy/10">
                <span>Product Development</span>
                <span className="font-semibold">40%</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-navy/10">
                <span>Sales & Marketing</span>
                <span className="font-semibold">35%</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-navy/10">
                <span>Operations</span>
                <span className="font-semibold">15%</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-navy/10">
                <span>Working Capital</span>
                <span className="font-semibold">10%</span>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-navy mb-4">Key Metrics</h3>
            <div className="grid grid-cols-2 gap-6 text-center">
              <div className="card p-4">
                <p className="text-sm text-navy/60 mb-1">Revenue (Year 5)</p>
                <p className="text-2xl font-bold text-gold">$5.2M</p>
              </div>
              <div className="card p-4">
                <p className="text-sm text-navy/60 mb-1">EBITDA (Year 5)</p>
                <p className="text-2xl font-bold text-green-600">$1.8M</p>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="text-center text-sm text-navy/60 py-6">
        <p>This is a template report. Customize with your actual model data.</p>
      </div>
    </div>
  );
}
