from flask import Flask, render_template, redirect, url_for, request, session, jsonify
from flask_bcrypt import Bcrypt
from flask_session import Session
import os
import psycopg2
import json

app=Flask(__name__)
app.config["SESSION_PERMANENT"]=False
app.config["SESSION_TYPE"]="filesystem"
Session(app)

@app.route("/")
def index():
	return redirect(url_for('home'))

@app.route("/home")
def home():
	return render_template('home.html')

@app.route("/home/userHomeSelection")
def return_house_json():
	if session.get("user"):
		utente=session.get("user")
		conn=psycopg2.connect(
		host="localhost",
		database="ptw_smart_house_db",
		user="ptw_admin",
		password="SUPER_ROOT")
	
		cur_house=conn.cursor()
		cur_room=conn.cursor()
		cur_device=conn.cursor()
		
		query1="SELECT house.idhouse,name FROM House JOIN CustomerHasHouse AS ch ON house.idhouse=ch.idhouse WHERE email=%s"
		cur_house.execute(query1,[utente])
		x={}
		for row_house in  cur_house.fetchall():
			x.update({row_house[0]:{"name":row_house[1]}})
			query2="SELECT idroom,name FROM Room WHERE idhouse=%s"
			cur_room.execute(query2,[row_house[0]])
			x[row_house[0]].update({"stanze":{}})
			for row_room in cur_room.fetchall():
				x[row_house[0]]["stanze"].update({row_room[0]:{"name":row_room[1]}})
				query3="SELECT devicecode,name,type FROM IoTDevice WHERE idroom=%s"
				cur_device.execute(query3,[row_room[0]])
				x[row_house[0]]["stanze"][row_room[0]].update({"devices":{}})
				for row_device in cur_device.fetchall():
					x[row_house[0]]["stanze"][row_room[0]]["devices"].update({row_device[0]:{"name":row_device[1],"type":row_device[2]}})
					
		y=json.dumps(x)
		return y
	else:
		return {"error_type":"SessionMissing","description":"No Session existing for this user"}

@app.route("/home/account")
def account():
	if session.get("user"):
		return "Tutto a posto: gestione utente"
	else:
		return redirect(url_for('login'))

@app.route("/home/account/update",methods=["POST"])
def update_user():
	if session.get("user"):
		conn=psycopg2.connect(
		host="localhost",
		database="ptw_smart_house_db",
		user="ptw_admin",
		password="SUPER_ROOT")
	
		cur=conn.cursor()
		
		bcrypt=Bcrypt(app)
		password=bcrypt.generate_password_hash(request.form["password"]).decode('utf-8')
		
		cur.execute("UPDATE Customers SET email=%s,password=%s,telephone=%s,name=%s,surname=%s WHERE email=%s",
			[request.form["email"],password,request.form["telephome"],request.form["name"],request.form["surname"],session.get('user')])
			
		return redirect(url_for('home'))
	else:
		return redirect(url_for('home'))

@app.route("/home/account/get_data")
def return_user_json():
	if session.get("user"):
		conn=psycopg2.connect(
		host="localhost",
		database="ptw_smart_house_db",
		user="ptw_admin",
		password="SUPER_ROOT")
	
		cur=conn.cursor()
		
		cur.execute("SELECT * FROM Customer WHERE email=%s",[session.get("user")])
		row=cur.fetchone()
		x={
			"email": row[0],
			"password": row[1],
			"telephone": row[2],
			"name":row[3],
			"surname":row[4]
		}
		y=json.dumps(x)
		
		return y
	else:
		return jesonify(error_type="SessionMissing",description="No Session existing for this user")

@app.route("/login")
def login():
	return render_template('login.html')
	
@app.route("/logout")
def logout():
	session['user']=None
	return render_template('login.html')

@app.route("/userhome",methods=['POST'])
def userhome():
	if request.method=='POST':
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
			session['user']=request.form['email']
			return redirect(url_for('home'))
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
		return "TQualcosa non è andato come previsto"


if __name__=="__main__":
	app.run(host='0.0.0.0',port=9600,debug=True)

