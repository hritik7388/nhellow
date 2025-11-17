pipeline {
    agent any
    
  environment {
        IMAGE_NAME = "bookimage:latest"
        GIT_BRANCH = "main"  // ← Tumhari branch ka exact naam
    }

    stages {

        stage('Checkout') {
            steps {
                echo "Checking out code..."
               git branch: "${GIT_BRANCH}", url: 'https://github.com/hritik7388/nhellow.git'
            }
        }

        stage('Install Dependencies') {
            steps {
                echo "Running npm install..."
                sh 'npm install'
            }
        }

        stage('Build Docker Image') {
            steps {
                echo "Building Docker Image..."
                sh "docker build -t ${IMAGE_NAME} ."
            }
        }

stage('Run Docker Compose') {
    steps {
        echo "Restarting containers..."
        sh 'docker rm -f stripe_mongo || true'  // remove if exists
        sh 'docker compose down || true'
        sh 'docker compose up -d --build'
    }
}

    post {
        success {
            echo "CI/CD Pipeline executed successfully 🎉"
        }
        failure {
            echo "Pipeline failed ❌"
        }
    }
}
