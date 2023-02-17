from flask import Flask, render_template, redirect, url_for, request, session
from flask_bcrypt import Bcrypt
from flask_session import Session
import os
import psycopg2

app=Flask(__name__)
app.config["SESSION_PERMANENT"]=False
app.config["SESSION_TYPE"]="filesystem"
Session(app)

@app.route("/")
def home():
	return render_template('home.html')

@app.route("/login")
def login():
	return render_template('login.html')

@app.route("/userhome",methods=['POST'])
def userhome():
	if request.method=='POST':
		session['user']=request.form['email']
		
		
		conn=psycopg2.connect(
		host="localhost",
		database="ptw_smart_house_db",
		user="ptw_admin",
		password="SUPER_ROOT")
	
		cur=conn.cursor()
		email=request.form['email']
		password=request.form['password']
		cur.execute('SELECT email,password FROM Customer WHERE email= %s',[email])
		rows=cur.fetchone()
		conn.commit()
	
		cur.close()
		conn.close()
		
		bcrypt=Bcrypt(app)
		if bcrypt.check_password_hash(rows[1],password):
			return rows[1]
	else:
		return redirect(url_for('login'))

@app.route("/jserror")
def error_nojs():
	return render_template('nojs.html')
	
@app.route("/register")
def register():
	return render_template('register.html')

@app.route("/confirmed_registration",methods=['POST'])
def register_user():
	if request.method=='POST':
		conn=psycopg2.connect(
		host="localhost",
		database="ptw_smart_house_db",
		user="ptw_admin",
		password="SUPER_ROOT")
	
		cur=conn.cursor()
		
		name=request.form['name']
		surname=request.form['surname']
		telephone=request.form['telephone']
		email=request.form['email']
		password=request.form['password']
		
		bcrypt=Bcrypt(app)
		hashed_password=bcrypt.generate_password_hash(password).decode('utf-8')
		
		cur.execute('SELECT COUNT(*) FROM Customer WHERE email=%s',[email])
		conn.commit()
		num_row=cur.fetchone()
		if(num_row[0]==1):
			return "Accont già esistente per questa e-mail"
		else:
			cur.execute('INSERT INTO Customer (email,password,telephone,name,surname) VALUES (%s,%s,%s,%s,%s)',[email,hashed_password,telephone,name,surname])
			conn.commit()
		cur.close()
		conn.close()
		return "Tutto registrato"
		
	else:
		return "Tutto a puttante, ma prima"


if __name__=="__main__":
	app.run(host='0.0.0.0',port=9600,debug=True)
