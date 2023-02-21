from flask import Flask, render_template, redirect, url_for, request, session
from flask_bcrypt import Bcrypt
from flask_session import Session
import requests
import os
import psycopg2
import json

# Mqtt imports
import time
import paho.mqtt.client as paho
from paho import mqtt

def on_connect(client, userdata, flags, rc, properties=None):
    print("CONNACK received with code %s." % rc)

def on_publish(client, userdata, mid, properties=None):
    print("mid: " + str(mid))

def on_subscribe(client, userdata, mid, granted_qos, properties=None):
    print("Subscribed: " + str(mid) + " " + str(granted_qos))

def on_message(client, userdata, msg):
    print("|Topic: " + msg.topic + "| - |Qos: " + str(msg.qos) + "| - |Payload: " + str(msg.payload) + "|")
    result=requests.post(f'http://192.168.1.41:9600/device/update_status',data="{} {}".format(msg.topic,msg.payload.decode('utf-8')))
    result.close()


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
		return {"status":"session missing"}

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
		if cur.rowcount!=0:
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
		else:
			return redirect(url_for('login'))
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
			return redirect(url_for('register'))
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
	if reques.method=="POST":
		conn=psycopg2.connect(
		host="localhost",
		database="ptw_smart_house_db",
		user="ptw_admin",
		password="SUPER_ROOT")
		cur=conn.cursor()
		query="INSERT INTO IoTDevice (deviceCode,idHouse,idRoom,name,type,onoff) VALUES (DEFAULT,%s,%s,%s,%s,False)"
		cur.execute(query,[request.form["house"],request.form["room"],request.form["name"],request.form["type"]])
		if cur.rowcount==1:
			return json.dumps({"status":"inserted"})
		else:
			return json.dumps({"status":"insert fail"})
	else:
		return json.dumps({"status":"method not allowd"})

@app.route("/device/update_status",methods=["POST"])
def update_status():
	if request.method=="POST":
		topic=request.data.decode('utf-8')
		print(topic)
		ii=0
		for i in range(len(topic)):
			if topic[i]=="/":
				ii=i
				break
		house=topic[0:ii]
		topic=topic[ii+1:len(topic)]
		for i in range(len(topic)):
			if topic[i]=="/":
				ii=i
				break
		room=topic[0:ii]
		topic=topic[ii+1:len(topic)]
		for i in range(len(topic)):
			if topic[i]==" ":
				ii=i
				break
		device=topic[0:ii]
		mqtt_message=topic[ii+1:len(topic)]
		if mqtt_message=="on":
			mqtt_message=True
		else:
			mqtt_message=False
		
		conn=psycopg2.connect(
		host="localhost",
		database="ptw_smart_house_db",
		user="ptw_admin",
		password="SUPER_ROOT")
		cur=conn.cursor()
		query="UPDATE IoTDevice SET OnOff=%s WHERE devicecode=%s AND idhouse=%s AND idroom=%s" 
		cur.execute(query,[mqtt_message,device,house,room])
		conn.commit()
		conn.close()
		conn.close()
		if cur.rowcount==1:
			return {"status":"updated"}
		else:
			return {"status":"error"}
			
	return {"status":"error"}

if __name__=="__main__":
	client = paho.Client(client_id="", userdata=None, protocol=paho.MQTTv5)
	client.on_connect = on_connect
	client.tls_set(tls_version=mqtt.client.ssl.PROTOCOL_TLS)
	client.username_pw_set("raspserver", "Raspserver-2023")
	client.connect("6dd678185e194e4ca3c7ffd5fe9abf15.s2.eu.hivemq.cloud", 8883)
	client.on_subscribe = on_subscribe
	client.on_message = on_message
	client.on_publish = on_publish
	client.subscribe("#", qos=2)
	client.loop_start()
	app.run(host='0.0.0.0',port=9600,debug=True)
	
