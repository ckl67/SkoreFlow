package config

// -------------------------------------------------------------------------
//
//		                  		USERS
//		                  		  │
//		        ┌───────────────┴─────────┐
//		        │               			    │
//		      admin             			   demo
//		        │               			    │
//		   data normal          			 data demo
//		        │                 			  │
//		        ▼                 			  ▼
//		     /scores            		/demo/scores
//		   uid connected   			 no authentication needed
//	  admin = user id : 1 			demo = user id : 2
//
// -------------------------------------------------------------------------
const (
	UidAdmin uint32 = 1
	UidDemo  uint32 = 2
)
