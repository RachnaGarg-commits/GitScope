// DOM Elements

const sortRepos = document.getElementById("sortRepos");

const loading = document.getElementById("loading");
const input = document.getElementById("usernameInput");
const searchBtn = document.getElementById("searchBtn");

const profileContainer = document.getElementById("profileContainer");

const repoContainer = document.getElementById("repoContainer");

const repoSearch = document.getElementById("repoSearch");

// Store repositories globally
let repositories = [];
let currentUser = null;

let recentSearches = [];
let languageChart = null;

// Event Listeners

searchBtn.addEventListener("click", searchUser);

input.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        searchUser();
    }
});

repoSearch.addEventListener("input", function () {

    const keyword = repoSearch.value.toLowerCase();

    const filteredRepos = repositories.filter(repo =>
        repo.name.toLowerCase().includes(keyword)
    );

    displayRepositories(filteredRepos);

});

// Search GitHub User

async function searchUser() {

    const username = input.value.trim();

    if (username === "") {

        alert("Please enter a GitHub username.");

        return;

    }

    loading.style.display = "block";


    profileContainer.innerHTML = `

<div class="skeleton">

</div>

`;

    repoContainer.innerHTML = `

<div class="skeleton"></div>

<div class="skeleton"></div>

<div class="skeleton"></div>

`;

    try {

        const response = await fetch(`https://api.github.com/users/${username}`);

        if (!response.ok) {

            throw new Error("User not found");

        }

        const user = await response.json();

        currentUser = user;

        displayProfile(user);

        fetchRepositories(username);

    }

    catch (error) {

        profileContainer.innerHTML = `

<div class="profile-card">

<h2>

❌ GitHub User Not Found

</h2>

<p>

Please check the username.

</p>

</div>

`;

        repoContainer.innerHTML = "";

        clearStatistics();

    }

}

// Display Profile

function displayProfile(user) {

    profileContainer.innerHTML = `

    <div class="profile-card">

        <img src="${user.avatar_url}" alt="Avatar">

        <div class="profile-info">

            <h2>${user.name || "No Name"}</h2>

            <p><strong>@${user.login}</strong></p>

            <p>${user.bio || "No Bio Available."}</p>

            <p>📍 ${user.location || "Unknown"}</p>

            <p>🏢 ${user.company || "Not Specified"}</p>

            <p>👥 Followers : ${user.followers}</p>

            <p>➡ Following : ${user.following}</p>

            <p>📂 Public Repositories : ${user.public_repos}</p>

            <a href="${user.html_url}" target="_blank">
                View GitHub Profile
            </a>
            <button
            onclick="copyProfile('${user.html_url}')">

            Copy Profile Link

            </button>

        </div>

    </div>

    `;

}

// Fetch Repositories

async function fetchRepositories(username) {

    try {

        const response = await fetch(
            `https://api.github.com/users/${username}/repos?per_page=100`
        );

        repositories = await response.json();

        displayRepositories(repositories);

        updateStatistics(repositories);

        generateLanguageChart(repositories);

        calculatePortfolioScore(
            currentUser,
            repositories
        );

        loading.style.display = "none";

    }

    catch (error) {

        repoContainer.innerHTML = `
            <h2>Unable to fetch repositories.</h2>
        `;

    }

}

// Display Repository Cards

function displayRepositories(repos) {

    repoContainer.innerHTML = "";

    if (repos.length === 0) {

        repoContainer.innerHTML = `
            <h2>No repositories found.</h2>
        `;

        return;

    }

    repos.forEach(repo => {

        repoContainer.innerHTML += `

        <div class="repo-card">

            <h3>${repo.name}</h3>

            <p>${repo.description || "No description available."}</p>

            <p>⭐ Stars : ${repo.stargazers_count}</p>

            <p>🍴 Forks : ${repo.forks_count}</p>

            <p>💻 Language : ${repo.language || "Not Specified"}</p>

            <p>📅 Updated :
                ${new Date(repo.updated_at).toLocaleDateString()}
            </p>

            <a href="${repo.html_url}" target="_blank">
                View Repository →
            </a>

        </div>

        `;

    });

}

// Statistics

function updateStatistics(repos) {

    let totalStars = 0;

    let totalForks = 0;

    let topRepo = "-";

    let highestStars = -1;

    repos.forEach(repo => {

        totalStars += repo.stargazers_count;

        totalForks += repo.forks_count;

        if (repo.stargazers_count > highestStars) {

            highestStars = repo.stargazers_count;

            topRepo = repo.name;

        }

    });

    document.getElementById("totalRepos").textContent = repos.length;

    document.getElementById("totalStars").textContent = totalStars;

    document.getElementById("totalForks").textContent = totalForks;

    document.getElementById("bestRepo").textContent = topRepo;

}


// Reset Statistics

function clearStatistics() {

    animateCounter(
        "totalRepos",
        repos.length
    );

    animateCounter(
        "totalStars",
        totalStars
    );

    animateCounter(
        "totalForks",
        totalForks
    );
    document.getElementById("bestRepo").textContent = "-";

}
function generateLanguageChart(repositories) {

    const languageCount = {};

    repositories.forEach(repo => {

        if (repo.language) {

            if (languageCount[repo.language]) {

                languageCount[repo.language]++;

            }

            else {

                languageCount[repo.language] = 1;

            }

        }

    });

    const labels = Object.keys(languageCount);

    const data = Object.values(languageCount);

    const ctx = document.getElementById("languageChart");

    if (languageChart) {

        languageChart.destroy();

    }

    languageChart = new Chart(ctx, {

        type: "pie",

        data: {

            labels: labels,

            datasets: [{

                data: data

            }]

        },

        options: {

            responsive: true,

            plugins: {

                legend: {

                    labels: {

                        color: "white",

                        font: {

                            size: 14

                        }

                    }

                }

            }

        }

    });

}
sortRepos.addEventListener("change", function () {

    let sorted = [...repositories];

    switch (sortRepos.value) {

        case "stars":

            sorted.sort((a, b) =>

                b.stargazers_count - a.stargazers_count

            );

            break;

        case "forks":

            sorted.sort((a, b) =>

                b.forks_count - a.forks_count

            );

            break;

        case "updated":

            sorted.sort((a, b) =>

                new Date(b.updated_at) - new Date(a.updated_at)

            );

            break;

        case "name":

            sorted.sort((a, b) =>

                a.name.localeCompare(b.name)

            );

            break;

        default:

            sorted = [...repositories];

    }

    displayRepositories(sorted);

});
function calculatePortfolioScore(user, repos) {

    let score = 0;

    score += Math.min(user.followers, 50);

    score += Math.min(user.public_repos, 30);

    score += repos.reduce(
        (sum, repo) => sum + repo.stargazers_count,
        0
    );

    score = Math.min(score, 100);

    document.getElementById("portfolioScore").textContent = score;

    let remark = "";

    if (score >= 80) {

        remark = "🔥 Excellent Profile";

    }

    else if (score >= 60) {

        remark = "🚀 Very Good";

    }

    else if (score >= 40) {

        remark = "👍 Good";

    }

    else {

        remark = "📚 Keep Building";

    }

    document.getElementById("portfolioRemark").textContent = remark;

}

function animateCounter(id, target) {

    const element = document.getElementById(id);

    let current = 0;

    const increment = Math.ceil(target / 60);

    const interval = setInterval(() => {

        current += increment;

        if (current >= target) {

            current = target;

            clearInterval(interval);

        }

        element.textContent = current;

    }, 20);

}
function copyProfile(url) {

    navigator.clipboard.writeText(url);

    alert("Profile Link Copied!");

}
document.querySelectorAll(".examples-text span").forEach(span => {
    span.addEventListener("click", () => {
        document.getElementById("username").value = span.textContent;
    });
});