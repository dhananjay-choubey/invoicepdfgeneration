Steps to configure nodejs app in IIS Server:

1. Copy the project folder content in C:\\ Drive with a name
2. Install IISNode and URLRewrite to IIS server
3. Configure the application on IIS server
4. Define absolute path C:\\invoicepdfgeneration in puppeteer.config.cjs file
5. Install nodejs from Nodejs.org
6. Run command node node_modules/puppeteer/install.js in the project folder
7. Assign privilages to the IIS_User for the project folder
8. run npm install
9. In MYSQL console run command ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'password'; where root is user and password is password.
10. Test the application