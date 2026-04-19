import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const modelId = id;

    // TODO: Check if user has paid for export using @raiseready/db
    const hasPaid = false; // Mock check

    if (!hasPaid) {
      // Redirect to Stripe checkout
      const checkoutResponse = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/checkout`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            modelId,
            userId: "user-id", // TODO: Get from auth context
          }),
        }
      );

      const { checkoutUrl } = await checkoutResponse.json();

      return NextResponse.json(
        { checkoutUrl },
        { status: 402 }
      );
    }

    // TODO: Generate Excel file using @raiseready/db data and xlsx library
    // For now, return a placeholder
    const excelBuffer = Buffer.from("Mock Excel content");

    return new NextResponse(excelBuffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="model-${modelId}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Failed to export model" },
      { status: 500 }
    );
  }
}
