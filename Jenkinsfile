pipeline { 
    agent any
    options { 
        buildDiscarder(logRotator(numToKeepStr: '3'))
        disableConcurrentBuilds()
        ansiColor('xterm')
    } 
    triggers {
        githubPush()
    }
    stages {
        stage ('Build') {
            environment {
                COVERALLS_TOKEN = credentials('celsus-lendings-coveralls-token')
            }
            steps {
                script {
                    docker.image('postgres:10.3-alpine').withRun('--name mypostgres --network host -e POSTGRES_PASSWORD=  -d') { db ->
                        docker.image('localstack/localstack:0.12.11').withRun('--name localstack -d --network host -e SERVICES=s3 -e DEFAULT_REGION=eu-central-1') { localstack ->
                            docker.image('671123374425.dkr.ecr.eu-central-1.amazonaws.com/jenkins/nodejs:14').inside("-u root --privileged --network host -e COVERALLS_GIT_BRANCH=${env.GIT_BRANCH} -e COVERALLS_SERVICE_NAME=internal-jenkins -e COVERALLS_REPO_TOKEN=${COVERALLS_TOKEN}") {
                                sh 'yarn install'
                                sh './wait-localstack.sh'
                                sh 'yarn build:ci'
                                sh 'yarn coverage'
                            }
                        }
                    }
                }
            }
        }
    }
}