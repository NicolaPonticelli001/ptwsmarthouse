from flask import Flask, render_template, redirect, url_for, request, session
from flask_bcrypt import Bcrypt
from flask_session import Session
import os
import psycopg2
import json

# Mqtt imports
import time
import paho.mqtt.client as paho
from paho import mqtt

# setting callbacks for different events to see if it works, print the message etc.
def on_connect(client, userdata, flags, rc, properties=None):
    print("CONNACK received with code %s." % rc)

# with this callback you can see if your publish was successful
def on_publish(client, userdata, mid, properties=None):
    print("mid: " + str(mid))

# print which topic was subscribed to
def on_subscribe(client, userdata, mid, granted_qos, properties=None):
    print("Subscribed: " + str(mid) + " " + str(granted_qos))

# print message, useful for checking if it was successful
def on_message(client, userdata, msg):
    print("|Topic: " + msg.topic + "| - |Qos: " + str(msg.qos) + "| - |Payload: " + str(msg.payload) + "|")

# using MQTT version 5 here, for 3.1.1: MQTTv311, 3.1: MQTTv31
# userdata is user defined data of any type, updated by user_data_set()
# client_id is the given name of the client
client = paho.Client(client_id="", userdata=None, protocol=paho.MQTTv5)
client.on_connect = on_connect

# enable TLS for secure connection
client.tls_set(tls_version=mqtt.client.ssl.PROTOCOL_TLS)
# set username and password
client.username_pw_set("raspserver", "Raspserver-2023")
# connect to HiveMQ Cloud on port 8883 (default for MQTT)
client.connect("6dd678185e194e4ca3c7ffd5fe9abf15.s2.eu.hivemq.cloud", 8883)

# setting callbacks, use separate functions like above for better visibility
client.on_subscribe = on_subscribe
client.on_message = on_message
client.on_publish = on_publish

# subscribe to all topics of encyclopedia by using the wildcard "#"
client.subscribe("#", qos=2)

# a single publish, this can also be done in loops, etc.
#client.publish("test", payload="test send", qos=1)

# loop_forever for simplicity, here you need to stop the loop manually
# you can also use loop_start and loop_stop

app=Flask(__name__)
app.config["SESSION_PERMANENT"]=False
app.config["SESSION_TYPE"]="filesystem"
Session(app)

@app.route("/")
def index():
	return redirect(url_for('home'))

@app.route("/home")
def home():
	if session.get("user"):
		return render_template('home.html')
	else:
		return redirect(url_for('login'))

@app.route("/home/userHomeSelection", methods=["POST"])
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
		return {"status":"session missing"}

@app.route("/login")
def login():
	return render_template('login.html')
	
@app.route("/logout")
def logout():
	session['user']=None
	return redirect(url_for('login'))

@app.route("/loginverification",methods=['POST'])
def loginverification():
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

@app.route("/register_user",methods=['POST'])
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
		return redirect(url_for('home'))
		
	else:
		return redirect(url_for('register'))


@app.route("/device/login_device",methods=["POST"])
def login_device():
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
		
		bcrypt=Bcrypt(app)
		if bcrypt.check_password_hash(rows[1],password):
			session['device_user']=request.form['email']
			
			cur_house=conn.cursor()
			cur_room=conn.cursor()
		
		
			query1="SELECT house.idhouse,name FROM House JOIN CustomerHasHouse AS ch ON house.idhouse=ch.idhouse WHERE email=%s"
			cur_house.execute(query1,[email])
			x={}
			for row_house in  cur_house.fetchall():
				x.update({row_house[0]:{"name":row_house[1]}})
				query2="SELECT idroom,name FROM Room WHERE idhouse=%s"
				cur_room.execute(query2,[row_house[0]])
				x[row_house[0]].update({"stanze":{}})
				for row_room in cur_room.fetchall():
					x[row_house[0]]["stanze"].update({row_room[0]:{"name":row_room[1]}})
			y=json.dumps(x)
			cur_house.close()
			cur_room.close()
			conn.close()
			return y
		else:
			return {"status":"login failed"}
	else:
		return {"status":"method not allowed"}

@app.route("/device/add_device",methods=["POST"])
def add_device():
	#Insert iotdevice
	#"house","room","name","type","onoff=f"
	if session.get("device_user"):
		if reques.method=="POST":
			conn=psycopg2.connect(
			host="localhost",
			database="ptw_smart_house_db",
			user="ptw_admin",
			password="SUPER_ROOT")
	
			cur=conn.cursor()
			query="INSERT INTO IoTDevice (deviceCode,idHouse,idRoom,name,type,onoff) VALUES (DEFAULT,%s,%s,%s,%s,False)"
			cur.execute(query,[request.form["house"],request.form["room"],request.form["name"],request.form["type"]])
			if cursor.rowcount==1:
				return json.dumps({"status":"inserted"})
			else:
				return json.dumps({"status":"insert fail"})
		else:
			return json.dumps({"status":"method not allowd"})
	else:
		return json.dumps({"status":"session missing"})

if __name__=="__main__":
	client.loop_start()
	app.run(host='0.0.0.0',port=9600,debug=True)
	

