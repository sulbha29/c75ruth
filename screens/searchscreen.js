import React from 'react'
import {Text, View, StyleSheet, FlatList, TouchableOpacity, KeyboardAvoidingView} from 'react-native'
import db from '../config'
import {ScrollView, TextInput} from 'react-native-gesture-handler'
export default class SearchScreen extends React.Component{
    constructor(props){
        super(props)
        this.state = {
            allTransactions:[], lastvisibletransaction: null, search :''
        }
    }
    componentDidMount = async()=>{
        const query = await db.collection('Transaction').get()
        query.docs.map((doc)=>{
            this.setState({
                allTransactions:[],lastvisibletransaction:doc
            })
        })
    }

    fetchMoreTransactions = async()=>{
        var text = this.state.search
        var enterText = text.split('')
        if(enterText[0]==='B'){
        const query = await db.collection('Transaction').where('bookID','==',text).startAfter(this.state.lastvisibletransaction).limit(10).get()
        query.docs.map((doc)=>{
            this.setState({
                allTransactions:[...this.state.allTransactions, doc.data()],lastvisibletransaction: doc
            })
        })
    }
    else if(enterText[0]==='S'){
        const query = await db.collection('Transaction').where('studentID','==',text).startAfter(this.state.lastvisibletransaction).limit(10).get()
        query.docs.map((doc)=>{
            this.setState({
                allTransactions:[...this.state.allTransactions, doc.data()],lastvisibletransaction: doc
            })
        })
    }
    }

    searchTransaction = async(text)=>{
        var enterText = text.split('')
        if(enterText[0]==='B'){
        const query = await db.collection('Transaction').where('bookID','==',text).get()
        query.docs.map((doc)=>{
            this.setState({
                allTransactions:[...this.state.allTransactions, doc.data()],lastvisibletransaction: doc
            })
        })
    }
    else if(enterText[0]==='S'){
        const query = await db.collection('Transaction').where('studentID','==',text).get()
        query.docs.map((doc)=>{
            this.setState({
                allTransactions:[...this.state.allTransactions, doc.data()],lastvisibletransaction: doc
            })
        })
    }
    }

    render(){
        return(
            <View style={styles.container}>
                <KeyboardAvoidingView>
                <View style={styles.searchBar}>
        <TextInput 
          style ={styles.bar}
          placeholder = "Enter Book Id or Student Id"
          onChangeText={(text)=>{this.setState({search:text})}}/>
         
         <TouchableOpacity
            style = {styles.searchButton}
            onPress={()=>{this.searchTransaction(this.state.search)}}
          >
            <Text>Search</Text>
          </TouchableOpacity>
          </View>
              
        
       
        <FlatList
            data = {this.state.allTransactions}
            renderItem = {({item})=>(
                <View style={{borderBottomWidth:3}}>
                        <Text>{'Book ID :'+item.bookID}</Text>
                        <Text>{'Student ID :'+item.studentID}</Text>
                        <Text>{'Transaction Type :'+item.transactionType}</Text>
                        <Text>{'Date :'+item.date.toDate()}</Text>
                    </View>
            )}
           keyExtractor = {(item, index)=>index.toString()}
           onEndReached = {this.fetchMoreTransactions}
           onEndReachedThreshold = {0.7}
        />
        </KeyboardAvoidingView>
        </View>)
    }
}




const styles = StyleSheet.create({
    container: {
      flex: 1,
      marginTop: 20
    },
    searchBar:{
      flexDirection:'row',
      height:40,
      width:'auto',
      borderWidth:0.5,
      alignItems:'center',
      backgroundColor:'grey',
  
    },
    bar:{
      borderWidth:2,
      height:30,
      width:300,
      paddingLeft:10,
    },
    searchButton:{
      borderWidth:1,
      height:30,
      width:50,
      alignItems:'center',
      justifyContent:'center',
      backgroundColor:'green'
    }
  })