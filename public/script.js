const checkAuth = document.getElementById("checkAuth");
checkAuth.onclick = function () {
	//log cookies
	console.log(getCookie("token"));
};
function getCookie(name) {
	const value = `; ${document.cookie}`;
	const parts = value.split(`; ${name}=`);
	if (parts.length === 2) return parts.pop().split(";").shift();
}
