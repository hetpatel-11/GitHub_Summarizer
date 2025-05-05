import axios from 'axios';

// Pure GitHub-based recruiter data: no AI, pure metrics & visualizable signals
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { username } = req.body;

  try {
    const headers = { Authorization: `token ${process.env.GITHUB_TOKEN}` };

    // Fetch basic profile
    const userRes = await axios.get(`https://api.github.com/users/${username}`, { headers });
    const profile = {
      login: userRes.data.login,
      name: userRes.data.name || userRes.data.login,
      avatar_url: userRes.data.avatar_url,
      bio: userRes.data.bio,
      public_repos: userRes.data.public_repos,
      followers: userRes.data.followers,
      following: userRes.data.following,
      created_at: userRes.data.created_at
    };

    // Fetch all repos
    const reposRes = await axios.get(
      `https://api.github.com/users/${username}/repos?per_page=100&sort=updated`,
      { headers }
    );
    const allRepos = reposRes.data.filter(r => !r.fork);

    // Compute language stats across all repos
    const languageStats = {};
    allRepos.forEach(repo => {
      if (repo.language) {
        languageStats[repo.language] = (languageStats[repo.language] || 0) + 1;
      }
    });

    // Top 3 repos by stars
    const topRepos = allRepos
      .sort((a,b) => b.stargazers_count - a.stargazers_count)
      .slice(0,3);

    // Detailed project metrics
    const projects = await Promise.all(topRepos.map(async repo => {
      // Fetch commit activity (weekly for last year)
      let commitWeeks = [];
      try {
        const commitRes = await axios.get(
          `https://api.github.com/repos/${username}/${repo.name}/stats/commit_activity`,
          { headers }
        );
        // commitRes.data is array of {week, total, days}
        commitWeeks = commitRes.data.map(week => ({ week: week.week, total: week.total }));
      } catch {
        // Stats may be delayed; ignore if unavailable
      }

      // Count commits in last 4 weeks
      const recentCommits = commitWeeks.slice(-4).reduce((sum, w) => sum + (w.total||0), 0);

      return {
        name: repo.name,
        html_url: repo.html_url,
        description: repo.description,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        language: repo.language,
        last_updated: repo.updated_at,
        recentCommits,
        commitWeeks
      };
    }));

    // Summary for recruiter
    res.status(200).json({ profile, languageStats, projects });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch GitHub data.' });
  }
}
