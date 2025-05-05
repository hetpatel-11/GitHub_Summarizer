import { useState } from 'react';

// A responsive project card with selective sandbox embed
function ProjectCard({ proj, login }) {
  const [showSandbox, setShowSandbox] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const sandboxUrl = `https://codesandbox.io/embed/github/${login}/${proj.name}?autoresize=1&fontsize=14&hidenavigation=1&theme=dark`;
  const ogImage = `https://opengraph.githubassets.com/1/${login}/${proj.name}`;
  
  // Check if project is sandbox compatible based on language or topics
  const isSandboxCompatible = () => {
    const compatibleLanguages = ['JavaScript', 'TypeScript', 'React', 'Vue', 'Angular', 'HTML'];
    return compatibleLanguages.includes(proj.language) || 
           (proj.topics && proj.topics.some(topic => 
             ['react', 'javascript', 'typescript', 'vue', 'frontend'].includes(topic.toLowerCase())
           ));
  };

  const toggleMaximize = (e) => {
    e.stopPropagation();
    setIsMaximized(!isMaximized);
  };

  return (
    <div className={`project-card ${isMaximized ? 'maximized' : ''}`}>
      <div className={`preview-container ${isMaximized ? 'maximized' : ''}`}>
        {showSandbox ? (
          <>
            <iframe
              src={sandboxUrl}
              className="sandbox-iframe"
              title={`${proj.name}-demo`}
              sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
            />
            {isMaximized && (
              <button 
                className="close-maximize-button"
                onClick={toggleMaximize}
                aria-label="Minimize sandbox"
              >
                ✕
              </button>
            )}
          </>
        ) : (
          <img
            src={ogImage}
            alt={`${proj.name} preview`}
            className="project-image"
          />
        )}
      </div>
      
      <div className="project-info">
        <div className="project-header">
          <a href={proj.html_url} target="_blank" rel="noreferrer" className="project-title">
            {proj.name}
          </a>
          
          {isSandboxCompatible() && (
            <div className="button-group">
              <button 
                onClick={() => setShowSandbox(!showSandbox)} 
                className={`toggle-button ${showSandbox ? 'active' : ''}`}
              >
                {showSandbox ? 'Hide Sandbox' : 'Try in Sandbox'}
              </button>
              
              {showSandbox && (
                <button 
                  onClick={toggleMaximize}
                  className="maximize-button"
                  aria-label={isMaximized ? "Minimize sandbox" : "Maximize sandbox"}
                >
                  {isMaximized ? '↙' : '↗'}
                </button>
              )}
            </div>
          )}
        </div>
        
        <p className="project-description">
          {proj.description || 'No description provided.'}
        </p>
        
        <div className="project-tags">
          {proj.language && (
            <span className="tag language-tag">
              {proj.language}
            </span>
          )}
          <span className="tag">
            ⭐ {proj.stars}
          </span>
          <span className="tag">
            🕒 {proj.recentCommits}
          </span>
          {proj.topics && proj.topics.slice(0, 3).map(topic => (
            <span key={topic} className="tag topic-tag">
              {topic}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [username, setUsername] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('stars');
  const [filterLanguage, setFilterLanguage] = useState('');
  const [maximizedProject, setMaximizedProject] = useState(null);

  const fetchProfile = async () => {
    if (!username.trim()) {
      setError('Please enter a GitHub username');
      return;
    }
    
    setLoading(true);
    setError(null);
    setData(null);
    
    try {
      const res = await fetch('/api/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      
      const result = await res.json();
      
      if (res.ok) {
        setData(result);
        // Extract available languages for filtering
        if (result.projects.length > 0) {
          setFilterLanguage('');
        }
      } else {
        setError(result.error || 'Error fetching data');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
    
    setLoading(false);
  };

  // Sort and filter projects
  const getFilteredProjects = () => {
    if (!data || !data.projects) return [];
    
    let filtered = [...data.projects];
    
    // Apply language filter if selected
    if (filterLanguage) {
      filtered = filtered.filter(proj => proj.language === filterLanguage);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'stars':
          return b.stars - a.stars;
        case 'recent':
          return b.recentCommits - a.recentCommits;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
    
    return filtered;
  };

  // Get unique languages from projects
  const getAvailableLanguages = () => {
    if (!data || !data.projects) return [];
    
    const languages = data.projects
      .map(proj => proj.language)
      .filter(Boolean);
      
    return [...new Set(languages)];
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1 className="app-title">CensoAI Project Showcase</h1>
        <p className="app-description">
          Discover and explore GitHub projects with interactive sandboxes for compatible repositories
        </p>
      </header>

      <div className="search-container">
        <div className="search-input-group">
          <input
            placeholder="Enter GitHub Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="search-input"
            onKeyPress={e => e.key === 'Enter' && fetchProfile()}
          />
          <button
            onClick={fetchProfile}
            disabled={loading}
            className="search-button"
          >
            {loading ? 'Loading...' : 'Showcase'}
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {data && (
        <>
          <div className="profile-header">
            <img src={data.profile.avatar_url} alt="Profile avatar" className="avatar" />
            <div className="profile-info">
              <h2 className="profile-name">
                {data.profile.name || data.profile.login}
              </h2>
              {data.profile.bio && (
                <p className="profile-bio">{data.profile.bio}</p>
              )}
              <div className="profile-stats">
                <span className="stat">
                  <strong>{data.profile.public_repos}</strong> Repositories
                </span>
                <span className="stat">
                  <strong>{data.profile.followers}</strong> Followers
                </span>
                <a 
                  href={`https://github.com/${data.profile.login}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="github-link"
                >
                  View on GitHub
                </a>
              </div>
            </div>
          </div>

          <div className="filters-container">
            <div className="sort-filter">
              <label htmlFor="sort-select">Sort by:</label>
              <select 
                id="sort-select"
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="select-input"
              >
                <option value="stars">Stars</option>
                <option value="recent">Recent Activity</option>
                <option value="name">Name</option>
              </select>
            </div>
            
            <div className="language-filter">
              <label htmlFor="language-select">Filter language:</label>
              <select
                id="language-select"
                value={filterLanguage}
                onChange={e => setFilterLanguage(e.target.value)}
                className="select-input"
              >
                <option value="">All Languages</option>
                {getAvailableLanguages().map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="projects-grid">
            {getFilteredProjects().length > 0 ? (
              getFilteredProjects().map(proj => (
                <ProjectCard 
                  key={proj.name} 
                  proj={proj} 
                  login={data.profile.login} 
                />
              ))
            ) : (
              <div className="no-projects-message">
                No projects match your current filters
              </div>
            )}
          </div>
        </>
      )}

      <style jsx global>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        body {
          background: #0d1117;
          color: #c9d1d9;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
            Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        }
        
        .app-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 1rem;
        }
        
        .header {
          text-align: center;
          margin-bottom: 2rem;
        }
        
        .app-title {
          color: #58a6ff;
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
        }
        
        .app-description {
          color: #8b949e;
          font-size: 1.1rem;
        }
        
        .search-container {
          margin-bottom: 2rem;
        }
        
        .search-input-group {
          display: flex;
          gap: 0.5rem;
          max-width: 600px;
          margin: 0 auto;
        }
        
        .search-input {
          flex: 1;
          padding: 0.75rem;
          border-radius: 0.375rem;
          border: 1px solid #30363d;
          background: #161b22;
          color: #c9d1d9;
          font-size: 1rem;
        }
        
        .search-button {
          padding: 0.75rem 1.5rem;
          background: #238636;
          color: #fff;
          border: none;
          border-radius: 0.375rem;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 600;
          transition: background 0.2s;
        }
        
        .search-button:hover {
          background: #2ea043;
        }
        
        .search-button:disabled {
          background: #238636;
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .error-message {
          color: #f85149;
          text-align: center;
          margin-bottom: 1rem;
          padding: 0.75rem;
          background: rgba(248, 81, 73, 0.1);
          border-radius: 0.375rem;
          border: 1px solid rgba(248, 81, 73, 0.2);
        }
        
        .profile-header {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          margin-bottom: 2rem;
          padding: 1.5rem;
          background: #161b22;
          border-radius: 0.5rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
        
        .avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          border: 3px solid #30363d;
        }
        
        .profile-info {
          flex: 1;
        }
        
        .profile-name {
          font-size: 1.75rem;
          color: #e6edf3;
          margin-bottom: 0.25rem;
        }
        
        .profile-bio {
          color: #8b949e;
          margin-bottom: 0.75rem;
        }
        
        .profile-stats {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          align-items: center;
        }
        
        .stat {
          color: #8b949e;
        }
        
        .stat strong {
          color: #c9d1d9;
        }
        
        .github-link {
          margin-left: auto;
          color: #58a6ff;
          text-decoration: none;
          font-weight: 600;
        }
        
        .github-link:hover {
          text-decoration: underline;
        }
        
        .filters-container {
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        
        .sort-filter, .language-filter {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .select-input {
          padding: 0.5rem;
          background: #161b22;
          border: 1px solid #30363d;
          border-radius: 0.375rem;
          color: #c9d1d9;
          font-size: 0.9rem;
        }
        
        .projects-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
        }
        
        .project-card {
          background: #161b22;
          border-radius: 0.5rem;
          overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          position: relative;
          z-index: 1;
        }
        
        .project-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
        }
        
        .project-card.maximized {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100%;
          height: 100%;
          z-index: 1000;
          border-radius: 0;
          transform: none;
          box-shadow: none;
          overflow: auto;
        }
        
        .preview-container {
          position: relative;
          width: 100%;
          height: 200px;
          background: #0d1117;
          transition: height 0.3s ease;
        }
        
        .preview-container.maximized {
          height: 85vh;
        }
        
        .project-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .sandbox-iframe {
          width: 100%;
          height: 100%;
          border: 0;
        }
        
        .close-maximize-button {
          position: absolute;
          top: 15px;
          right: 15px;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(13, 17, 23, 0.8);
          color: #f0f6fc;
          border: none;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 10;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
        }
        
        .close-maximize-button:hover {
          background: rgba(13, 17, 23, 1);
        }
        
        .project-info {
          padding: 1.25rem;
        }
        
        .project-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }
        
        .project-title {
          color: #58a6ff;
          font-size: 1.25rem;
          font-weight: 600;
          text-decoration: none;
          margin-right: 0.5rem;
        }
        
        .project-title:hover {
          text-decoration: underline;
        }
        
        .button-group {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }
        
        .toggle-button {
          padding: 0.4rem 0.75rem;
          background: #1f6feb;
          color: #fff;
          border: none;
          border-radius: 0.25rem;
          cursor: pointer;
          font-size: 0.8rem;
          white-space: nowrap;
          transition: background 0.2s;
        }
        
        .toggle-button:hover {
          background: #388bfd;
        }
        
        .toggle-button.active {
          background: #2ea043;
        }
        
        .toggle-button.active:hover {
          background: #3fb950;
        }
        
        .maximize-button {
          padding: 0.4rem;
          width: 28px;
          height: 28px;
          background: #30363d;
          color: #c9d1d9;
          border: none;
          border-radius: 0.25rem;
          cursor: pointer;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s, color 0.2s;
        }
        
        .maximize-button:hover {
          background: #3c444d;
          color: #fff;
        }
        
        .project-description {
          color: #8b949e;
          margin-bottom: 1rem;
          line-height: 1.5;
          height: 3em;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        
        .project-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        
        .tag {
          background: #21262d;
          color: #c9d1d9;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.8rem;
        }
        
        .language-tag {
          background: #0d419d;
        }
        
        .topic-tag {
          background: #32383f;
          color: #58a6ff;
        }
        
        .no-projects-message {
          grid-column: 1 / -1;
          text-align: center;
          padding: 3rem;
          color: #8b949e;
          background: #161b22;
          border-radius: 0.5rem;
        }
        
        @media (max-width: 768px) {
          .profile-header {
            flex-direction: column;
            text-align: center;
            padding: 1rem;
          }
          
          .profile-stats {
            justify-content: center;
          }
          
          .github-link {
            margin: 0.5rem auto 0;
          }
          
          .filters-container {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}