# Arena PWA Deployment Functions
# Add this to your shell profile (.bashrc, .zshrc) for permanent access

# Quick deployment function
arena_deploy() {
    if [ -z "$1" ]; then
        echo "Usage: arena_deploy 'commit message'"
        return 1
    fi
    
    echo "🚀 Arena PWA Auto-Deploy Started..."
    
    # Add, commit, push
    git add .
    git commit -m "$1"
    git push origin main
    
    # Build and deploy
    npm run build
    firebase deploy --only hosting
    
    echo "✅ Deployed to: https://leaderreps-pd-platform.web.app/"
}

# Quick build and deploy (no commit)
arena_deploy_only() {
    echo "🚀 Building and deploying Arena PWA..."
    npm run build
    firebase deploy --only hosting
    echo "✅ Deployed to: https://leaderreps-pd-platform.web.app/"
}

# Quick commit and push (no deploy)
arena_commit() {
    if [ -z "$1" ]; then
        echo "Usage: arena_commit 'commit message'"
        return 1
    fi
    
    git add .
    git commit -m "$1"
    git push origin main
    echo "✅ Changes pushed to GitHub"
}