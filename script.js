async function startPaymentPolling(tx) {
    setInterval(async () => {
        const res = await fetch(
            `${API_BASE_URL}/api/check-status/${tx}`
        );

        const data = await res.json();

        console.log(data);

        if (
            data.success &&
            data.order_status === "paid"
        ) {
            alert("Payment Success!");
        }
    }, 4000);
}
