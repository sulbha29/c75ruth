import React from 'react'
import {Text, View, StyleSheet, TouchableOpacity, Image, TextInput, Alert, KeyboardAvoidingView} from 'react-native'
import * as Permissions from 'expo-permissions'
import {BarCodeScanner} from 'expo-barcode-scanner'
import firebase from 'firebase';
import db from '../config'

export default class TransactionScreen extends React.Component{
    constructor(){
        super()
        this.state = {
            hasCameraPermission:null, scan:false, scanData:'', buttonState:'normal', scanBookID:'', scanStudentID:'', transactionMessage:'',

        }
    }
    getCameraPermission = async(id)=>{
        const {status} = await Permissions.askAsync(Permissions.CAMERA)
        this.setState({
            hasCameraPermission:status === "granted", 
            buttonState:id,
            scan:false
        })
    }
    handleBarcodeScan = async({type,data})=>{
        const {buttonState}=this.state
        if(buttonState==='bookID'){
        this.setState({
            scan:true,
            scanBookID:data,
            buttonState:'normal'
        })
    }
    else if(buttonState==='studentID'){
        this.setState({
            scan:true,
            scanStudentID:data,
            buttonState:'normal'
        })
    }
    }

    checkBookEligibility = async()=>{
        const bookRef = await db.collection('Books').where('bookID','==',this.state.scanBookID).get()
        var transactionType = '';
        if(bookRef.docs.length === 0){
            transactionType = false
        } else{
            bookRef.docs.map(doc=>{
                var book = doc.data()
                if(book.bookAvailability){
                    transactionType = 'issue'
                }
                else{
                    transactionType = 'return'
                }
            })
        }
        return transactionType
    }

    checkStudentEligibilityForBookIssue = async()=>{
        const studentRef = await db.collection('Students').where('studentID','==',this.state.scanStudentID).get()
        var isStudentEligible = ''
        if(studentRef.docs.length === 0){
            this.setState({
                scanStudentId:'',
                scanBookID:''
            })
            isStudentEligible = false;
            Alert.alert('The student ID does not exist.')
        }
        else{
            studentRef.docs.map(doc=>{
                var student = doc.data()
                if(student.numberOfBooksIssued<2){
                    isStudentEligible = true;
                }
                else{
                    isStudentEligible = false;
                    Alert.alert('This student has already issued 2 books.')
                    this.setState({scanBookID:'',scanStudentID:''})
                }
                
            })
        }
        return isStudentEligible
    }

    checkStudentEligibilityForBookReturn = async()=>{
        const transactionRef = await db.collection('Transaction').where('bookID','==',this.state.scanBookID).limit(1).get()
        var isStudentEligible = ''
        transactionRef.docs.map(doc=>{
            var lastBookTransaction = doc.data()
            if(lastBookTransaction.studentID === this.state.scanStudentID){
                isStudentEligible = true;
            }
            else{
                isStudentEligible = false;
                Alert.alert('This book was not issued by this student.')
                this.setState({scanBookID:'',scanStudentID:''})
            }
        })
        return isStudentEligible
    }

    handleTransaction = async()=>{
        var transactionType = await this.checkBookEligibility()
        if(!transactionType){
            Alert.alert("This book doesn't exist in the library.")
            this.setState({scanBookID:'',scanStudentID:''})
        }
        else if(transactionType === 'issue'){
            var isStudentEligible = await this.checkStudentEligibilityForBookIssue()
            if(isStudentEligible){
                this.initiateBookIssue()
                Alert.alert('Book issued.')
            }
        }
        else{
            var isStudentEligible = await this.checkStudentEligibilityForBookReturn()
            if(isStudentEligible){
                this.initiateBookReturn()
                Alert.alert('Book returned.')
            }
        }
    }
    initiateBookIssue = async()=>{
        db.collection('Transaction').add({
            studentID:this.state.scanStudentID,
            bookID:this.state.scanBookID,
            date:firebase.firestore.Timestamp.now().toDate(),
            transactionType:'issue'
        })
        db.collection('Books').doc(this.state.scanBookID).update({
            bookAvailability:false
        })
        db.collection('Students').doc(this.state.scanStudentID).update({
            numberOfBooksIssued:firebase.firestore.FieldValue.increment(1)
        })
        Alert.alert('Book Issued')
        this.setState({
            scanBookID:'',
            scanStudentID:''
        })
    }
    initiateBookReturn = async()=>{
        db.collection('Transaction').add({
            studentID:this.state.scanStudentID,
            bookID:this.state.scanBookID,
            date:firebase.firestore.Timestamp.now().toDate(),
            transactionType:'return'
        })
        db.collection('Books').doc(this.state.scanBookID).update({
            bookAvailability:true
        })
        db.collection('Students').doc(this.state.scanStudentID).update({
            numberOfBooksIssued:firebase.firestore.FieldValue.increment(-1)
        })
        Alert.alert('Book Returned')
        this.setState({
            scanBookID:'',
            scanStudentID:''
        })
    }
    render(){
        const hasCameraPermission = this.state.hasCameraPermission
        const scan = this.state.scan
        const buttonState = this.state.buttonState
        if(buttonState !== 'normal' && hasCameraPermission){
            return(
                <BarCodeScanner onBarCodeScanned = {scan? undefined:this.handleBarcodeScan}
                style={StyleSheet.absoluteFillObject}/>
            )
        }
        else if(buttonState === 'normal'){
        return(<KeyboardAvoidingView style={styles.container} behaviour = 'padding' enabled>
            <View><Image source = {require('../assets/booklogo.jpg')} style = {{width:200,height:200}}/><Text style={{textAlign:'center',fontSize:30,fontWeight:'bold'}}>Wireless Library</Text></View>
            <View style={styles.inputView}>
                <TextInput style={styles.inputBox}
                placeholder = 'Book ID'
                onChangeText = {text=>this.setState({scanBookID:text})}
                value = {this.state.scanBookID}/>
                <TouchableOpacity style={styles.scanButton} onPress={()=>{this.getCameraPermission('bookID')}} ><Text style={styles.buttonText}>Scan</Text></TouchableOpacity>
            </View>
            <View style={styles.inputView}>
                <TextInput style={styles.inputBox}
                placeholder = 'Student ID'
                onChangeText = {text=>this.setState({scanStudentID:text})}
                value = {this.state.scanStudentID}/>
                <TouchableOpacity style={styles.scanButton} onPress={()=>{this.getCameraPermission('studentID')}}><Text style={styles.buttonText}>Scan</Text></TouchableOpacity>
            </View>
            
            <TouchableOpacity style={styles.submitButton} onPress={async()=>{var transactionMessage=await this.handleTransaction()
            }}>
                <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>
            </KeyboardAvoidingView>
            )
    }
}
}

const styles = StyleSheet.create({ container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
 displayText:{ fontSize: 15, textDecorationLine: 'underline' }, 
 buttonText:{ fontSize: 15, textAlign: 'center', marginTop: 10 },
inputView:{ flexDirection: 'row', margin: 20 },
 inputBox:{ width: 200, height: 40, borderWidth: 1.5, borderRightWidth: 0, fontSize: 20 }, 
 scanButton:{ backgroundColor: '#66BB6A', width: 50, borderWidth: 1.5, borderLeftWidth: 0 },
submitButton:{backgroundColor:'pink',width:50, height:20,},
submitButtonText:{textAlign:'center',fontSize:15,fontWeight:'bold',color:'blue',padding:10}
});