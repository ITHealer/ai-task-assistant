-- Create additional databases for different environments
CREATE DATABASE task_assistant_dev;
-- CREATE DATABASE task_assistant_test;
-- CREATE DATABASE task_assistant_staging;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE task_assistant TO taskuser;
GRANT ALL PRIVILEGES ON DATABASE task_assistant_dev TO taskuser;
-- GRANT ALL PRIVILEGES ON DATABASE task_assistant_test TO taskuser;
-- GRANT ALL PRIVILEGES ON DATABASE task_assistant_staging TO taskuser;