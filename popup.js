var rates = localStorage.getItem("rates");

if (rates) {
    rates = JSON.parse(rates);

    document.getElementById("fox-rate").innerHTML = rates.fox;
    document.getElementById("loc-rate").innerHTML = rates.loc;
    document.getElementById("b2u-rate").innerHTML = rates.b2u;
}